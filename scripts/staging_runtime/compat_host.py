"""Operator-only real compatibility probes. Fixed descriptors; no SceneMap adapter."""
import hashlib
import shutil
import json
from pathlib import Path
import subprocess
import sys
import threading
import time
import uuid
from acquire import REPO, CACHE, IDS, record, verify_bundle, safe_path, private_root
from admission import observe
from isolation import DOCKER, ENV, cli
from compat_protocol import WIDTH, HEIGHT, PROMPT_HASH, request, response, encode, decode

ROOT=REPO/'scripts/staging_runtime'
IMAGE='sha256:fa3d2775b699b548515cc11efb615102d46d642b463a2d513930b6e84fc99c29'
FILES=('compat_worker.py','compat_protocol.py','protocol.py','bindings/sam-static-config.json','bindings/sam-video-exclusions.json')


def descriptor(ident):
    if ident not in IDS: raise ValueError('IMPLEMENTATION_NOT_REGISTERED')
    d=json.loads((ROOT/'bindings/descriptors.json').read_text())[ident]
    r=record(ident)
    if set(d)!={'implementationId','version','entrypoint','runtimeImage','protocolVersion','task','supportedClasses','modelRecordId','modelRevision','files','sourceSha256','requirementsSha256','wheelsSha256','policy'}:
        raise ValueError('DESCRIPTOR_SPOOF')
    if (d['version']!='compatibility-1' or d['supportedClasses']!=['synthetic-compatibility-only']
        or d['requirementsSha256']!='fc2ddd17269a6e050b76aba2fe0a1d4a70ea99bf55db1433d6a2329f18ab5fb9'
        or d['wheelsSha256']!='4a09d44bc1db86528aa7f7318cc91bb43effcdcbd772bb215e74b11afd324356'
        or type(d['protocolVersion']) is not int or d['implementationId']!=ident or d['runtimeImage']!=IMAGE or d['entrypoint']!='/opt/qualification/compat_worker.py'
        or d['protocolVersion']!=1 or d['task']!=r['task'] or d['modelRecordId']!=ident
        or d['modelRevision']!=r['revision'] or d['files']!=r['files']
        or d['policy']!={'network':'none','hostMemoryBytes':8*1024**3,'timeoutSeconds':120,'cpus':2,'pids':64,'tmpfsBytes':67108864}
        or set(d['sourceSha256'])!=set(FILES)):
        raise ValueError('DESCRIPTOR_SPOOF')
    for f,h in d['sourceSha256'].items():
        if hashlib.sha256(safe_path(ROOT/f).read_bytes()).hexdigest()!=h:raise ValueError('WORKER_HASH_MISMATCH')
    for f,key in [('requirements.lock','requirementsSha256'),('wheels.lock.json','wheelsSha256')]:
        if hashlib.sha256((ROOT/f).read_bytes()).hexdigest()!=d[key]:raise ValueError('RUNTIME_LOCK_MISMATCH')
    return d


def synthetic_request(d):
    # Fixed generated RGB rectangle, never a customer/benchmark image.
    image=bytes(c for y in range(HEIGHT) for x in range(WIDTH)
                for c in ((180,60,40) if 64<=x<192 and 48<=y<144 else (235,235,235)))
    config=next(f for f in d['files'] if f['filename']=='config.json')
    meta=dict(version=1,implementationId=d['implementationId'],task=d['task'],configurationHash=config['sha256'],
              image=dict(width=WIDTH,height=HEIGHT,format='rgb8',sha256=hashlib.sha256(image).hexdigest()),
              promptHash=PROMPT_HASH if d['task']=='detection' else None,
              box=[64,48,192,144] if d['task']=='segmentation' else None)
    request(meta,image)
    return meta,encode(meta,image)


def run(ident,cancel=None):
    if cancel is not None and cancel.is_set():raise RuntimeError('CANCELLED_BEFORE_LAUNCH')
    d=descriptor(ident);private_root();before=verify_bundle(ident)
    inspected=json.loads(cli(['image','inspect',IMAGE]).stdout)[0]
    if inspected['Descriptor']['digest']!=IMAGE:raise ValueError('RUNTIME_IMAGE_MISMATCH')
    admission=observe()
    if admission['status']!='MEMORY_ADMISSION_PASSED_NOT_EXECUTION_APPROVAL':
        raise RuntimeError(admission['status'])
    name='roomstager-r14b1-compat-'+uuid.uuid4().hex
    models=safe_path(CACHE/'models'/ident/d['modelRevision'])
    args=['run','--pull=never','--name',name,'--network','none','--read-only','--user','65534:65534',
          '--cap-drop','ALL','--security-opt','no-new-privileges','--memory','8g','--memory-swap','8g',
          '--cpus','2','--pids-limit','64','--tmpfs','/tmp:rw,noexec,nosuid,size=67108864','--gpus','all',
          '--env','HF_HUB_OFFLINE=1','--env','TRANSFORMERS_OFFLINE=1','--env','HF_HUB_DISABLE_TELEMETRY=1',
          '--env','HF_HUB_DISABLE_PROGRESS_BARS=1','--env','HOME=/tmp',
          '--mount','type=bind,source='+str(models)+',target=/models,readonly',
          '--mount','type=bind,source='+str(ROOT/'bindings')+',target=/bindings,readonly']
    for f in ('compat_worker.py','compat_protocol.py','protocol.py'):
        args+=['--mount','type=bind,source='+str(ROOT/f)+',target=/opt/qualification/'+f+',readonly']
    args+=['--entrypoint','python','-i',IMAGE,'-s','/opt/qualification/compat_worker.py']
    # Docker -i keeps binary stdin open; Python receives only fixed host arguments.
    meta,payload=synthetic_request(d)
    process=subprocess.Popen([DOCKER,*args],env=ENV,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    out,err,overflow=bytearray(),bytearray(),threading.Event()
    def read(stream,target,limit):
        while True:
            b=stream.read(4096)
            if not b:break
            if len(target)+len(b)>limit:overflow.set();break
            target.extend(b)
    def write():
        try:process.stdin.write(payload);process.stdin.close()
        except (BrokenPipeError,OSError):pass
    threads=[threading.Thread(target=read,args=(process.stdout,out,2*1024*1024),daemon=True),
             threading.Thread(target=read,args=(process.stderr,err,65536),daemon=True),threading.Thread(target=write,daemon=True)]
    for t in threads:t.start()
    started=time.monotonic();state='completed'
    try:
        while process.poll() is None:
            if overflow.is_set():state='output-limit';break
            if cancel and cancel.is_set():state='cancelled';break
            if time.monotonic()-started>120:state='timed-out';break
            time.sleep(.05)
        if state!='completed':cli(['kill',name])
        try:process.wait(timeout=10)
        except subprocess.TimeoutExpired:process.kill();process.wait(timeout=5)
    finally:
        cli(['rm','-f',name])
        for t in threads:t.join(timeout=2)
        process.stdout.close();process.stderr.close()
        if cli(['inspect',name]).returncode==0:raise RuntimeError('CONTAINER_CLEANUP_FAILED')
    if overflow.is_set():state='output-limit'
    evidence=dict(implementationId=ident,admission=admission,containerRemoved=True,transportStatus=state,
                  exitCode=process.returncode,descriptorSha256=hashlib.sha256(json.dumps(d,sort_keys=True).encode()).hexdigest(),
                  runtimeImage=IMAGE,modelCacheUnchanged=verify_bundle(ident)==before)
    if not evidence['modelCacheUnchanged']:raise ValueError('POST_RUN_CACHE_CHANGED')
    if state=='completed' and process.returncode==0:
        result,binary=decode(bytes(out));response(result,binary,ident)
        expected_exclusions=json.loads((ROOT/'bindings/sam-video-exclusions.json').read_text()) if ident=='sam21-small-hf-v1' else []
        if result['status']=='completed' and result['keys']['excludedVideo']!=expected_exclusions:raise ValueError('RESPONSE_EXCLUSIONS_MISMATCH')
        if result['configurationHash']!=meta['configurationHash']:raise ValueError('RESPONSE_CONFIG_MISMATCH')
        evidence.update(result=result,binaryBytes=len(binary),binarySha256=hashlib.sha256(binary).hexdigest())
    else:evidence['result']=None
    results=safe_path(CACHE/'compatibility');results.mkdir(exist_ok=True)
    history=results/'history';history.mkdir(exist_ok=True)
    archive_id=str(time.time_ns())+'-'+uuid.uuid4().hex
    for suffix in ('.json','.stderr.txt'):
        prior=results/(ident+suffix)
        if prior.exists():shutil.copy2(prior,history/(archive_id+'-'+ident+suffix))
    (results/(ident+'.json')).write_text(json.dumps(evidence,indent=2)+'\n')
    (results/(ident+'.stderr.txt')).write_bytes(err)
    print(json.dumps(evidence,indent=2))
    if evidence['result'] is None or evidence['result']['status']!='completed':raise RuntimeError('COMPATIBILITY_BLOCKED')
    return evidence


if __name__=='__main__':
    if len(sys.argv)!=2:raise ValueError('EXPECTED_REGISTERED_IMPLEMENTATION_ID')
    run(sys.argv[1])
