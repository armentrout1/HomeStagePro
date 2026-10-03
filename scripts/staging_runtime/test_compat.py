"""Focused boundary tests; no model loading, network, or Docker daemon required."""
import copy
import io
import json
from pathlib import Path
import struct
import threading
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace
import compat_host as h
import compat_protocol as p
import compat_registry as registry


def result(ident='grounding-dino-tiny-hf-v1'):
    return dict(version=1,implementationId=ident,status='completed',task=p.IDS[ident],
        width=p.WIDTH,height=p.HEIGHT,scoreKind='estimated',scores=[.5],
        boxes=[[1,2,3,4]] if p.IDS[ident]=='detection' else [],
        configurationHash='a'*64,networkAttempts=0,failure=None,
        keys=dict(missing=[],unexpected=[],excludedVideo=[]),
        resources={k:1 for k in ['loadSeconds','inferenceSeconds','hostRssBytes',
            'gpuPeakAllocatedBytes','gpuPeakReservedBytes','gpuTotalBytes','gpuFreeBytes']},
        runtime=dict(torch='2.14.1+cu130',transformers='5.18.0',device='cuda:0',
                     dtype='float32',determinism='not-qualified'))


class CompatibilityTests(unittest.TestCase):
    def test_exact_registry(self):
        self.assertEqual(registry.IMPLEMENTATIONS,('synthetic-test-worker',*p.IDS))
        for ident in registry.IMPLEMENTATIONS:
            self.assertEqual(registry.resolve(ident)['implementationId'],ident)
        for ident in ('florence2-base-ms-v1','../worker','python','',None):
            with self.assertRaises(ValueError):registry.resolve(ident)

    def test_request_roundtrip_and_mutations(self):
        for ident in p.IDS:
            meta,frame=h.synthetic_request(h.descriptor(ident)); decoded,binary=p.decode(frame)
            self.assertEqual(p.request(decoded,binary),ident)
            for key,value in [('configurationHash','z'*64),('promptHash','bad'),('box',[0,0,1,1]),
                              ('implementationId','florence2-base-ms-v1'),('task','depth')]:
                bad=copy.deepcopy(meta);bad[key]=value
                with self.assertRaises(ValueError):p.request(bad,binary)
            with self.assertRaises(ValueError):p.request(meta,binary[:-1])
            with self.assertRaises(ValueError):p.request(dict(meta,path='/models/evil'),binary)

    def test_descriptor_spoofs(self):
        path=h.ROOT/'bindings/descriptors.json'; original=Path.read_text
        catalog=json.loads(path.read_text());ident=next(iter(p.IDS))
        for key,value in [('entrypoint','/tmp/worker'),('runtimeImage','latest'),('version','other'),
                          ('supportedClasses',['wall']),('task','depth'),('modelRevision','main'),
                          ('requirementsSha256','a'*64),('wheelsSha256','a'*64),
                          ('protocolVersion',True),('shell','python')]:
            altered=copy.deepcopy(catalog);altered[ident][key]=value
            def read(obj,*a,**kw):return json.dumps(altered) if obj==path else original(obj,*a,**kw)
            with patch.object(Path,'read_text',read):
                with self.assertRaises(ValueError):h.descriptor(ident)

    def test_worker_hash_mismatch(self):
        original=Path.read_bytes
        def read(obj):return b'tampered' if obj==h.ROOT/'compat_worker.py' else original(obj)
        with patch.object(Path,'read_bytes',read):
            with self.assertRaisesRegex(ValueError,'WORKER_HASH_MISMATCH'):h.descriptor(next(iter(p.IDS)))

    def test_exported_nonfinite_and_bounds(self):
        for value in [float('nan'),float('inf'),float('-inf'),-0.1,1.1,True]:
            m=result();m['scores']=[value]
            with self.assertRaises(ValueError):p.response(m,b'',m['implementationId'])
        for box in [[0,0,float('inf'),1],[0,0,257,1],[3,0,1,1]]:
            m=result();m['boxes']=[box]
            with self.assertRaises(ValueError):p.response(m,b'',m['implementationId'])

    def test_authority_network_keys_and_resources(self):
        for key in ['trusted','verified','path','editingAuthorization','absence']:
            m=result();m[key]=True
            with self.assertRaises(ValueError):p.response(m,b'',m['implementationId'])
        for key,value in [('networkAttempts',1),('scoreKind','verified'),('configurationHash','g'*64)]:
            m=result();m[key]=value
            with self.assertRaises(ValueError):p.response(m,b'',m['implementationId'])
        for group in ('missing','unexpected','excludedVideo'):
            m=result();m['keys'][group]=['core.weight']
            with self.assertRaises(ValueError):p.response(m,b'',m['implementationId'])
        for value in [None,float('nan'),-1]:
            m=result();m['resources']['loadSeconds']=value
            with self.assertRaises(ValueError):p.response(m,b'',m['implementationId'])

    def test_mask_dimensions_and_values(self):
        ident='sam21-small-hf-v1';m=result(ident);binary=b'\1'*(p.WIDTH*p.HEIGHT)
        p.response(m,binary,ident)
        for bad in [binary[:-1],b'\2'+binary[1:]]:
            with self.assertRaises(ValueError):p.response(m,bad,ident)

    def test_failed_result_cannot_export_observations(self):
        m=result();m.update(status='failed',failure='MODEL_COMPATIBILITY_FAILED')
        with self.assertRaises(ValueError):p.response(m,b'',m['implementationId'])
        m.update(scores=[],boxes=[]);p.response(m,b'',m['implementationId'])

    def test_malformed_frames(self):
        for raw in [b'',b'NOPE'+b'\0'*8,p.encode(result())+b'trailing',
                    b'R1B1'+struct.pack('>II',p.decode.__globals__['JSON_LIMIT']+1,0)]:
            with self.assertRaises(ValueError):p.decode(raw)

    def test_cancelled_before_load(self):
        cancel=threading.Event();cancel.set()
        with patch.object(h,'verify_bundle') as verify:
            with self.assertRaisesRegex(RuntimeError,'CANCELLED_BEFORE_LAUNCH'):h.run(next(iter(p.IDS)),cancel)
            verify.assert_not_called()

    def test_missing_or_tampered_bundle_never_launches(self):
        for error in [FileNotFoundError('absent'),ValueError('HASH_MISMATCH')]:
            with patch.object(h,'private_root'),patch.object(h,'verify_bundle',side_effect=error),patch.object(h.subprocess,'Popen') as launch:
                with self.assertRaises(type(error)):h.run(next(iter(p.IDS)))
                launch.assert_not_called()

    def test_memory_rejection_never_launches(self):
        with patch.object(h,'private_root'),patch.object(h,'verify_bundle',return_value={}), \
             patch.object(h,'cli',return_value=SimpleNamespace(stdout=json.dumps([{'Descriptor':{'digest':h.IMAGE}}]).encode())), \
             patch.object(h,'observe',return_value={'status':'BLOCKED_REAL_INFERENCE_HOST_MEMORY'}), \
             patch.object(h.subprocess,'Popen') as launch:
            with self.assertRaisesRegex(RuntimeError,'BLOCKED_REAL_INFERENCE_HOST_MEMORY'):h.run(next(iter(p.IDS)))
            launch.assert_not_called()

    def test_active_timeout_and_cancellation_remove_container(self):
        for disposition in ('timed-out','cancelled'):
            commands=[]
            class Process:
                def __init__(self,*args,**kwargs):
                    command=args[0]
                    self_outer.assertIn('--read-only',command)
                    self_outer.assertEqual(command[command.index('--network')+1],'none')
                    self_outer.assertNotIn('/var/run/docker.sock',' '.join(command))
                    self.stdin=io.BytesIO();self.stdout=io.BytesIO();self.stderr=io.BytesIO();self.returncode=None
                def poll(self):return None
                def wait(self,timeout):self.returncode=-9
                def kill(self):self.returncode=-9
            def cli(args):
                commands.append(args)
                if args[:2]==['image','inspect']:
                    return SimpleNamespace(stdout=json.dumps([{'Descriptor':{'digest':h.IMAGE}}]).encode(),returncode=0)
                return SimpleNamespace(stdout=b'',returncode=1 if args[0]=='inspect' else 0)
            self_outer=self
            cancel=SimpleNamespace(is_set=unittest.mock.Mock(side_effect=[False,True])) if disposition=='cancelled' else None
            with tempfile.TemporaryDirectory() as folder,patch.object(h,'CACHE',Path(folder)), \
                 patch.object(h,'private_root'),patch.object(h,'verify_bundle',return_value={}), \
                 patch.object(h,'observe',return_value={'status':'MEMORY_ADMISSION_PASSED_NOT_EXECUTION_APPROVAL'}), \
                 patch.object(h,'cli',side_effect=cli),patch.object(h,'DOCKER','docker'),patch.object(h.subprocess,'Popen',Process), \
                 patch.object(h.time,'monotonic',side_effect=[0,121]),patch('builtins.print'):
                with self.assertRaisesRegex(RuntimeError,'COMPATIBILITY_BLOCKED'):h.run(next(iter(p.IDS)),cancel)
                report=json.loads((Path(folder)/'compatibility'/(next(iter(p.IDS))+'.json')).read_text())
                self.assertEqual(report['transportStatus'],disposition)
                self.assertTrue(report['containerRemoved'])
            self.assertTrue(any(c[0]=='kill' for c in commands))
            self.assertTrue(any(c[:2]==['rm','-f'] for c in commands))

    def test_static_mapping_and_exact_exclusions(self):
        import hashlib
        root=h.ROOT/'bindings'
        lineage=json.loads((root/'sam-lineage.json').read_text())
        self.assertEqual(hashlib.sha256((root/'sam-static-config.json').read_bytes()).hexdigest(),lineage['derivedSha256'])
        self.assertEqual(hashlib.sha256((root/'sam-video-exclusions.json').read_bytes()).hexdigest(),lineage['exclusionsSha256'])
        keys=json.loads((root/'sam-video-exclusions.json').read_text())
        rationale=json.loads((root/'sam-video-exclusion-rationale.json').read_text())
        self.assertEqual(keys,sorted(set(keys)))
        self.assertEqual(len(keys),160)
        self.assertEqual([item['key'] for item in rationale['keys']],keys)
        self.assertTrue(all(item['reason'] for item in rationale['keys']))
        self.assertNotIn('no_memory_embedding',keys)
        self.assertEqual(lineage['parentSha256'],next(f['sha256'] for f in h.descriptor('sam21-small-hf-v1')['files'] if f['filename']=='config.json'))

    def test_worker_network_audit_rejects(self):
        try:import resource
        except ImportError:self.skipTest('Run this case in pinned Linux runtime')
        import compat_worker as worker
        before=worker.network_attempts
        for event in ('socket.connect','socket.getaddrinfo','socket.gethostbyname','socket.sendto'):
            with self.assertRaisesRegex(RuntimeError,'NETWORK_FORBIDDEN'):worker.audit(event,())
        self.assertEqual(worker.network_attempts,before+4)

    def test_internal_padding_native_tensor_validation(self):
        # Linux pinned runtime supplies torch/resource; Windows host need not install either.
        try:import torch,resource
        except ImportError:self.skipTest('Run this case in pinned Linux runtime')
        from compat_worker import validate_detection_tensors
        validate_detection_tensors(torch,torch.tensor([0.,float('-inf')]),torch.tensor([0.,1.]))
        self.assertEqual(torch.tensor(float('-inf')).sigmoid().item(),0.)
        for value in [float('inf'),float('nan')]:
            with self.assertRaises(ValueError):validate_detection_tensors(torch,torch.tensor([value]),torch.tensor([0.]))
        with self.assertRaises(ValueError):validate_detection_tensors(torch,torch.tensor([0.]),torch.tensor([float('inf')]))


if __name__=='__main__':unittest.main()
