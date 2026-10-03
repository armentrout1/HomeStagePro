"""R1.4B2 bounded canonical PNG transport, using qualified R1B1 framing."""
import hashlib
import math
from protocol import encode, decode
IDS={'grounding-dino-tiny-hf-v1':'detection','sam21-small-hf-v1':'segmentation'}
PROMPT_HASH='84bfe361eb9e1f2f1f93a4aec4ef6982bc2ff8a428a12ad252fd94187e4138ac'
MAX_MASK_BYTES=16*1024*1024

def request(meta,binary):
    if set(meta)!={'version','implementationId','task','sourceSha256','width','height','promptHash','boxes','profile'}:raise ValueError('REQUEST_KEYS')
    if meta['version']!='scene-local/2' or meta['implementationId'] not in IDS or meta['task']!=IDS[meta['implementationId']]:raise ValueError('REQUEST_IMPLEMENTATION')
    if meta['promptHash']!=PROMPT_HASH or hashlib.sha256(binary).hexdigest()!=meta['sourceSha256']:raise ValueError('REQUEST_HASH')
    if meta['profile'] not in ('study','t10','t15','t20','t25') or meta['task']=='segmentation' and meta['profile']=='study':raise ValueError('REQUEST_PROFILE')
    w,h=meta['width'],meta['height']
    if type(w) is not int or type(h) is not int or not 1<=w<=2048 or not 1<=h<=2048 or len(binary)>32*1024*1024:raise ValueError('REQUEST_SIZE')
    boxes=meta['boxes']
    if not isinstance(boxes,list) or len(boxes)>32 or meta['task']=='detection' and boxes:raise ValueError('REQUEST_BOX_COUNT')
    ids=set()
    for item in boxes:
        if set(item)!={'id','box'} or not isinstance(item['id'],str) or not item['id'].replace('-','').isalnum() or len(item['id'])>128 or item['id'] in ids:raise ValueError('REQUEST_BOX_ID')
        ids.add(item['id']);b=item['box']
        if not isinstance(b,list) or len(b)!=4 or any(type(x) not in (int,float) or not math.isfinite(x) for x in b) or not (0<=b[0]<b[2]<=w and 0<=b[1]<b[3]<=h):raise ValueError('REQUEST_BOX')
    return meta['implementationId']
