"""Fixed evaluation-only native DINO/SAM worker. No SceneMap authority or paths in input."""
import io,json,sys,struct,time,resource,hashlib
from pathlib import Path
import compat_worker as baseline
from scene_protocol import request,decode,encode,PROMPT_HASH,MAX_MASK_BYTES

def main():
    prefix=sys.stdin.buffer.read(12)
    if len(prefix)!=12 or prefix[:4]!=b'R1B1':raise ValueError('FRAME_HEADER')
    j,b=struct.unpack('>II',prefix[4:])
    if j>1024*1024 or b>32*1024*1024:raise ValueError('FRAME_LIMIT')
    meta,image=decode(prefix+sys.stdin.buffer.read(j+b+1));ident=request(meta,image)
    import os
    if any(os.environ.get(k)!='1' for k in ('HF_HUB_OFFLINE','TRANSFORMERS_OFFLINE','HF_HUB_DISABLE_TELEMETRY')):raise ValueError('OFFLINE_REQUIRED')
    import torch,transformers
    from PIL import Image
    if torch.__version__!='2.14.1+cu130' or transformers.__version__!='5.18.0':raise ValueError('RUNTIME_MISMATCH')
    picture=Image.open(io.BytesIO(image));picture.load()
    if picture.format!='PNG' or picture.mode!='RGB' or picture.size!=(meta['width'],meta['height']):raise ValueError('CANONICAL_IMAGE')
    torch.manual_seed(0);torch.set_num_threads(2);torch.cuda.reset_peak_memory_stats()
    result=dict(version='scene-local/1',implementationId=ident,task=meta['task'],sourceSha256=meta['sourceSha256'],width=meta['width'],height=meta['height'],promptHash=PROMPT_HASH,status='completed',failure=None,detections=[],masks=[],networkAttempts=0,keys=dict(missing=[],unexpected=[],excludedVideo=[]),resources={})
    binary=bytearray();start=time.monotonic()
    if meta['task']=='detection':
        from transformers import GroundingDinoForObjectDetection,GroundingDinoProcessor
        model,info=GroundingDinoForObjectDetection.from_pretrained('/models',local_files_only=True,trust_remote_code=False,use_safetensors=True,output_loading_info=True)
        if any(info.get(k) for k in ('missing_keys','unexpected_keys','mismatched_keys','error_msgs')):raise ValueError('MODEL_KEYS')
        processor=GroundingDinoProcessor.from_pretrained('/models',local_files_only=True,trust_remote_code=False)
        vocab=Path('/bindings/scene-vocabulary.json').read_bytes()
        if hashlib.sha256(vocab).hexdigest()!=PROMPT_HASH:raise ValueError('PROMPT_HASH')
        model=model.eval().to('cuda');torch.cuda.synchronize();result['resources']['loadSeconds']=time.monotonic()-start;start=time.monotonic()
        for group in json.loads(vocab)['groups']:
            tokens=processor.tokenizer(group['text'],truncation=False)['input_ids']
            if len(tokens)>model.config.max_text_len:raise ValueError('PROMPT_TOO_LONG')
            inputs=processor(images=picture,text=group['text'],return_tensors='pt').to('cuda')
            with torch.inference_mode():outputs=model(**inputs)
            baseline.validate_detection_tensors(torch,outputs.logits,outputs.pred_boxes)
            found=processor.post_process_grounded_object_detection(outputs,inputs.input_ids,threshold=.20,text_threshold=.20,target_sizes=[(meta['height'],meta['width'])])[0]
            if len(found['scores'])>128:raise ValueError('GROUP_DETECTION_OVERFLOW')
            boxes=found['boxes'].detach().cpu();boxes[:,0::2].clamp_(0,meta['width']);boxes[:,1::2].clamp_(0,meta['height'])
            for box,score,label in zip(boxes.tolist(),found['scores'].detach().cpu().tolist(),found['text_labels']):
                if not isinstance(label,str) or len(label)>128:raise ValueError('LABEL_LIMIT')
                result['detections'].append(dict(group=group['id'],label=label,box=box,score=score))
    else:
        from transformers import Sam2Model,Sam2Config,Sam2Processor,Sam2ImageProcessor
        from safetensors.torch import load_file
        model=Sam2Model(Sam2Config.from_dict(json.loads(Path('/bindings/sam-static-config.json').read_text())))
        weights=load_file('/models/model.safetensors',device='cpu');expected=set(model.state_dict());provided=set(weights)
        allowed=json.loads(Path('/bindings/sam-video-exclusions.json').read_text())
        if expected-provided or sorted(provided-expected)!=allowed:raise ValueError('SAM_MODEL_KEYS')
        result['keys']['excludedVideo']=allowed;model.load_state_dict({k:weights[k] for k in expected},strict=True);del weights
        processor=Sam2Processor(image_processor=Sam2ImageProcessor.from_pretrained('/models',local_files_only=True))
        model=model.eval().to('cuda');torch.cuda.synchronize();result['resources']['loadSeconds']=time.monotonic()-start;start=time.monotonic()
        pixels=processor(images=picture,return_tensors='pt').to('cuda')
        with torch.inference_mode():embeddings=model.get_image_embeddings(pixels['pixel_values'])
        # One prompt per call (<= frozen batch maximum four), reusing one image embedding.
        # Qualified single-mask path: no alternative candidates are silently discarded.
        for item in meta['boxes']:
            try:
                inputs=processor(images=picture,input_boxes=[[item['box']]],return_tensors='pt').to('cuda')
                with torch.inference_mode():outputs=model(image_embeddings=embeddings,input_boxes=inputs['input_boxes'],multimask_output=False)
                if not torch.isfinite(outputs.pred_masks).all() or not torch.isfinite(outputs.iou_scores).all():raise ValueError('NONFINITE')
                mask=processor.post_process_masks(outputs.pred_masks,inputs['original_sizes'])[0].squeeze()
                if tuple(mask.shape)!=(meta['height'],meta['width']):raise ValueError('MASK_SHAPE')
                score=outputs.iou_scores.item()
                if not 0<=score<=1:raise ValueError('MASK_SCORE')
                buf=io.BytesIO();Image.fromarray((mask.to(torch.uint8)*255).cpu().numpy()).save(buf,format='PNG')
                data=buf.getvalue()
                if len(binary)+len(data)>MAX_MASK_BYTES:raise RuntimeError('MASK_BYTE_OVERFLOW')
                result['masks'].append(dict(id=item['id'],status='completed',score=score,offset=len(binary),bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),failure=None));binary.extend(data)
            except RuntimeError:raise
            except Exception:
                result['masks'].append(dict(id=item['id'],status='failed',score=None,offset=len(binary),bytes=0,sha256=None,failure='MASK_REFINEMENT_FAILED'))
    torch.cuda.synchronize();result['resources']['inferenceSeconds']=time.monotonic()-start
    free,total=torch.cuda.mem_get_info()
    result['resources'].update(hostRssBytes=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024,gpuPeakAllocatedBytes=torch.cuda.max_memory_allocated(),gpuPeakReservedBytes=torch.cuda.max_memory_reserved(),gpuFreeBytes=free,gpuTotalBytes=total)
    result['networkAttempts']=baseline.network_attempts
    if baseline.network_attempts:raise ValueError('NETWORK_FORBIDDEN')
    sys.stdout.buffer.write(encode(result,bytes(binary)))

if __name__=='__main__':
    try:main()
    except Exception as exc:
        print(type(exc).__name__+': '+str(exc)[:1000],file=sys.stderr);raise SystemExit(1)
