"""B2 request boundary tests: no model execution, downloads, or network."""
import copy, hashlib, unittest
import scene_protocol as p

class SceneProtocolTests(unittest.TestCase):
    def request(self, ident='grounding-dino-tiny-hf-v1'):
        data=b'canonical-png-validated-by-worker'
        return dict(version='scene-local/1',implementationId=ident,task=p.IDS[ident],sourceSha256=hashlib.sha256(data).hexdigest(),width=32,height=24,promptHash=p.PROMPT_HASH,boxes=[]),data
    def test_fixed_implementation_and_prompt(self):
        meta,data=self.request()
        self.assertEqual(p.request(meta,data),meta['implementationId'])
        for key,value in [('implementationId','python'),('promptHash','a'*64),('task','depth'),('width',True),('height',2049),('sourceSha256','b'*64),('freePrompt','door')]:
            changed={**meta,key:value}
            with self.assertRaises(ValueError): p.request(changed,data)
    def test_bounded_box_input(self):
        meta,data=self.request('sam21-small-hf-v1')
        box={'id':'det-1','box':[0,0,32,24]};meta['boxes']=[box]
        self.assertEqual(p.request(meta,data),meta['implementationId'])
        for boxes in [[box]*33,[box,box],[{**box,'box':[0,0,float('nan'),2]}],[{**box,'box':[0,0,float('inf'),2]}],[{**box,'box':[0,0,33,24]}],[{**box,'box':[2,0,1,2]}],[{**box,'path':'worker.py'}]]:
            with self.assertRaises(ValueError):p.request({**meta,'boxes':boxes},data)
    def test_frame_roundtrip_and_hash(self):
        meta,data=self.request()
        self.assertEqual(p.decode(p.encode(meta,data)),(meta,data))
        with self.assertRaises(ValueError):p.request(meta,data+b'x')
        with self.assertRaises(ValueError):p.decode(p.encode(meta,data)+b'x')

if __name__=='__main__': unittest.main()
