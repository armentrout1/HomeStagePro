"""Strict synthetic compatibility protocol; never grants SceneMap authority."""
import hashlib
import math
import re
from protocol import encode, decode

IDS = {'grounding-dino-tiny-hf-v1': 'detection', 'sam21-small-hf-v1': 'segmentation'}
PROMPT = 'a chair.'
PROMPT_HASH = hashlib.sha256(PROMPT.encode()).hexdigest()
WIDTH, HEIGHT = 256, 192


def request(meta, binary):
    if set(meta) != {'version','implementationId','task','configurationHash','image','promptHash','box'}:
        raise ValueError('REQUEST_KEYS')
    ident=meta['implementationId']
    if ident not in IDS or meta['version'] != 1 or meta['task'] != IDS[ident]:
        raise ValueError('REQUEST_IMPLEMENTATION')
    if meta['image'] != {'width':WIDTH,'height':HEIGHT,'format':'rgb8','sha256':hashlib.sha256(binary).hexdigest()}:
        raise ValueError('REQUEST_IMAGE')
    if len(binary)!=WIDTH*HEIGHT*3:
        raise ValueError('REQUEST_IMAGE_LENGTH')
    if meta['promptHash'] != (PROMPT_HASH if IDS[ident]=='detection' else None):
        raise ValueError('REQUEST_PROMPT')
    if meta['box'] != ([64,48,192,144] if IDS[ident]=='segmentation' else None):
        raise ValueError('REQUEST_BOX')
    if not isinstance(meta['configurationHash'],str) or re.fullmatch(r'[a-f0-9]{64}',meta['configurationHash']) is None:
        raise ValueError('REQUEST_CONFIG')
    return ident


def response(meta, binary, ident):
    keys={'version','implementationId','status','task','width','height','scoreKind','scores','boxes',
          'resources','runtime','keys','configurationHash','networkAttempts','failure'}
    if set(meta)!=keys or meta['implementationId']!=ident or meta['version']!=1 or meta['task']!=IDS[ident]:
        raise ValueError('RESPONSE_KEYS')
    if (not isinstance(meta['configurationHash'],str) or re.fullmatch(r'[a-f0-9]{64}',meta['configurationHash']) is None
        or type(meta['version']) is not int or type(meta['networkAttempts']) is not int):raise ValueError('RESPONSE_TYPES')
    if meta['width']!=WIDTH or meta['height']!=HEIGHT or meta['scoreKind']!='estimated':
        raise ValueError('RESPONSE_METADATA')
    if meta['status'] not in ('completed','failed') or meta['failure'] not in (None,'MODEL_COMPATIBILITY_FAILED'):
        raise ValueError('RESPONSE_STATUS')
    r=meta['resources']
    if set(r)!={'loadSeconds','inferenceSeconds','hostRssBytes','gpuPeakAllocatedBytes','gpuPeakReservedBytes','gpuTotalBytes','gpuFreeBytes'}:
        raise ValueError('RESPONSE_RESOURCES')
    for v in r.values():
        if v is not None and (type(v) not in (float,int) or not math.isfinite(v) or v<0):
            raise ValueError('RESPONSE_RESOURCE_VALUE')
    if meta['runtime'] != {'torch':'2.14.1+cu130','transformers':'5.18.0','device':'cuda:0','dtype':'float32','determinism':'not-qualified'}:
        raise ValueError('RESPONSE_RUNTIME')
    if meta['networkAttempts']!=0 or set(meta['keys'])!={'missing','unexpected','excludedVideo'}:
        raise ValueError('RESPONSE_KEYS_OR_NETWORK')
    for group in meta['keys'].values():
        if not isinstance(group,list) or len(group)>1024 or any(not isinstance(k,str) or len(k)>256 or '/' in k or ':' in k for k in group):
            raise ValueError('RESPONSE_KEY_NAMES')
    if meta['status']=='failed':
        if binary or meta['scores'] or meta['boxes'] or meta['failure'] is None: raise ValueError('RESPONSE_FAILURE')
        return
    if any(v is None for v in r.values()):raise ValueError('RESPONSE_MISSING_MEASUREMENTS')
    if meta['failure'] is not None or meta['keys']['missing'] or meta['keys']['unexpected']:
        raise ValueError('RESPONSE_UNQUALIFIED_KEYS')
    if ident=='grounding-dino-tiny-hf-v1' and meta['keys']['excludedVideo']:raise ValueError('RESPONSE_EXCLUSIONS')
    from protocol import validate_result
    validate_result({k:meta[k] for k in ['version','task','width','height','scores','boxes','scoreKind']},binary,WIDTH,HEIGHT)
