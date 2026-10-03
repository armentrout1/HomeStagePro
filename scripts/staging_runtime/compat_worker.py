"""Fixed native-model compatibility worker. Synthetic imagery only; no Room Stager adapter."""
import hashlib
import json
import os
from pathlib import Path
import resource
import struct
import sys
import time

from compat_protocol import request, response, decode, encode, PROMPT, WIDTH, HEIGHT

network_attempts=0
def audit(event,args):
    global network_attempts
    if event in ('socket.connect','socket.getaddrinfo','socket.gethostbyname','socket.sendto'):
        network_attempts+=1
        raise RuntimeError('NETWORK_FORBIDDEN')
sys.addaudithook(audit)

def validate_detection_tensors(torch, logits, boxes):
    # Only negative infinity is a legitimate native masked/padded logit.
    # Positive infinity and NaN must not become accepted sigmoid scores.
    if not (torch.isfinite(logits) | torch.isneginf(logits)).all() or not torch.isfinite(boxes).all():
        raise ValueError('NONFINITE')


def main():
    prefix=sys.stdin.buffer.read(12)
    if len(prefix)!=12 or prefix[:4]!=b'R1B1': raise ValueError('FRAME_HEADER')
    j,b=struct.unpack('>II',prefix[4:])
    if j>1024*1024 or b>32*1024*1024: raise ValueError('FRAME_LIMIT')
    payload=sys.stdin.buffer.read(j+b+1)
    meta,image=decode(prefix+payload)
    ident=request(meta,image)
    config_path=Path('/models/config.json')
    original=config_path.read_bytes()
    if hashlib.sha256(original).hexdigest()!=meta['configurationHash']: raise ValueError('CONFIG_MISMATCH')
    for k in ('HF_HUB_OFFLINE','TRANSFORMERS_OFFLINE','HF_HUB_DISABLE_TELEMETRY'):
        if os.environ.get(k)!='1': raise ValueError('OFFLINE_REQUIRED')
    import torch
    import transformers
    from PIL import Image
    if torch.__version__!='2.14.1+cu130' or transformers.__version__!='5.18.0':raise ValueError('RUNTIME_MISMATCH')
    torch.manual_seed(0); torch.set_num_threads(2)
    torch.cuda.reset_peak_memory_stats()
    result=dict(version=1,implementationId=ident,status='failed',task=meta['task'],width=WIDTH,height=HEIGHT,
                scoreKind='estimated',scores=[],boxes=[],configurationHash=meta['configurationHash'],networkAttempts=0,
                keys=dict(missing=[],unexpected=[],excludedVideo=[]),failure='MODEL_COMPATIBILITY_FAILED',
                runtime=dict(torch=torch.__version__,transformers=transformers.__version__,device='cuda:0',dtype='float32',determinism='not-qualified'),
                resources={k:None for k in ['loadSeconds','inferenceSeconds','hostRssBytes','gpuPeakAllocatedBytes','gpuPeakReservedBytes','gpuTotalBytes','gpuFreeBytes']})
    binary=b''; start=time.monotonic()
    try:
        picture=Image.frombytes('RGB',(WIDTH,HEIGHT),image)
        if meta['task']=='detection':
            from transformers import GroundingDinoForObjectDetection, GroundingDinoProcessor
            model,info=GroundingDinoForObjectDetection.from_pretrained('/models',local_files_only=True,
                trust_remote_code=False,use_safetensors=True,output_loading_info=True)
            result['keys']['missing']=sorted(info.get('missing_keys',[]))
            result['keys']['unexpected']=sorted(info.get('unexpected_keys',[]))
            if result['keys']['missing'] or result['keys']['unexpected'] or info.get('mismatched_keys') or info.get('error_msgs'):
                raise ValueError('MODEL_KEYS')
            processor=GroundingDinoProcessor.from_pretrained('/models',local_files_only=True,trust_remote_code=False)
            model=model.eval().to('cuda')
            inputs=processor(images=picture,text=PROMPT,return_tensors='pt').to('cuda')
            torch.cuda.synchronize();result['resources']['loadSeconds']=time.monotonic()-start; start=time.monotonic()
            with torch.inference_mode(): outputs=model(**inputs)
            torch.cuda.synchronize();result['resources']['inferenceSeconds']=time.monotonic()-start
            # Native contrastive head pads masked text positions with -inf; sigmoid maps them to zero.
            validate_detection_tensors(torch,outputs.logits,outputs.pred_boxes)
            processed=processor.post_process_grounded_object_detection(outputs,inputs.input_ids,threshold=.25,text_threshold=.25,target_sizes=[(HEIGHT,WIDTH)])[0]
            boxes=processed['boxes'].detach().cpu()
            # Canonical clipping is explicit; no dimension/aspect-ratio change.
            boxes[:,0::2].clamp_(0,WIDTH); boxes[:,1::2].clamp_(0,HEIGHT)
            result['boxes']=boxes.tolist();result['scores']=processed['scores'].detach().cpu().tolist()
        else:
            from transformers import Sam2Model, Sam2Config, Sam2Processor, Sam2ImageProcessor
            from safetensors.torch import load_file
            # Mapping is prepared/reviewed by the host and mounted read-only; no silent config mutation.
            derived=json.loads(Path('/bindings/sam-static-config.json').read_text())
            model=Sam2Model(Sam2Config.from_dict(derived))
            weights=load_file('/models/model.safetensors',device='cpu')
            expected=set(model.state_dict()); provided=set(weights)
            result['keys']['missing']=sorted(expected-provided)
            extras=sorted(provided-expected)
            allowed=json.loads(Path('/bindings/sam-video-exclusions.json').read_text())
            result['keys']['excludedVideo']=sorted(set(extras)&set(allowed))
            result['keys']['unexpected']=sorted(set(extras)-set(allowed))
            if result['keys']['missing'] or result['keys']['unexpected'] or extras!=allowed:raise ValueError('SAM_MODEL_KEYS')
            model.load_state_dict({k:weights[k] for k in expected},strict=True)
            del weights
            processor=Sam2Processor(image_processor=Sam2ImageProcessor.from_pretrained('/models',local_files_only=True))
            model=model.eval().to('cuda')
            inputs=processor(images=picture,input_boxes=[[meta['box']]],return_tensors='pt').to('cuda')
            torch.cuda.synchronize();result['resources']['loadSeconds']=time.monotonic()-start;start=time.monotonic()
            with torch.inference_mode(): outputs=model(**inputs,multimask_output=False)
            torch.cuda.synchronize();result['resources']['inferenceSeconds']=time.monotonic()-start
            if not torch.isfinite(outputs.pred_masks).all() or not torch.isfinite(outputs.iou_scores).all():raise ValueError('SAM_NONFINITE')
            mask=processor.post_process_masks(outputs.pred_masks,inputs['original_sizes'])[0].squeeze()
            if tuple(mask.shape)!=(HEIGHT,WIDTH):raise ValueError('SAM_MASK_SHAPE')
            binary=mask.to(torch.uint8).cpu().numpy().tobytes()
            result['scores']=outputs.iou_scores.detach().cpu().reshape(-1).tolist()
        result['status']='completed';result['failure']=None
    except Exception as exc:
        # Bounded developer diagnostics; host never forwards raw stderr to product users.
        print(type(exc).__name__+': '+str(exc)[:1500],file=sys.stderr)
        binary=b'';result['scores']=[];result['boxes']=[]
    result['resources']['hostRssBytes']=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024
    result['resources']['gpuPeakAllocatedBytes']=torch.cuda.max_memory_allocated()
    result['resources']['gpuPeakReservedBytes']=torch.cuda.max_memory_reserved()
    free,total=torch.cuda.mem_get_info();result['resources']['gpuFreeBytes']=free;result['resources']['gpuTotalBytes']=total
    result['networkAttempts']=network_attempts
    response(result,binary,ident)
    sys.stdout.buffer.write(encode(result,binary))

if __name__=='__main__': main()
