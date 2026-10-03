import unittest,hashlib,json
from pathlib import Path
import scene_protocol_v2 as p
class V2ProtocolTests(unittest.TestCase):
 def meta(self):
  b=b'canonical';return dict(version='scene-local/2',implementationId='grounding-dino-tiny-hf-v1',task='detection',sourceSha256=hashlib.sha256(b).hexdigest(),width=32,height=24,promptHash=p.PROMPT_HASH,boxes=[],profile='study'),b
 def test_fixed_profiles(self):
  m,b=self.meta()
  for profile in ('study','t10','t15','t20','t25'):self.assertEqual(p.request({**m,'profile':profile},b),m['implementationId'])
  for profile in ('t05','t30','custom','python'):
   with self.assertRaises(ValueError):p.request({**m,'profile':profile},b)
  with self.assertRaises(ValueError):p.request({**m,'implementationId':'sam21-small-hf-v1','task':'segmentation'},b)
 def test_prompt_pin_and_reject_free_prompt(self):
  self.assertEqual(hashlib.sha256((Path(__file__).parent/'bindings/scene-vocabulary-v2.json').read_bytes()).hexdigest(),p.PROMPT_HASH)
  m,b=self.meta()
  with self.assertRaises(ValueError):p.request({**m,'prompt':'custom'},b)
