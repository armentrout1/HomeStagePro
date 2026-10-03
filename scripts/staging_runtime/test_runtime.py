import io
import json
import os
from pathlib import Path
import socket
import struct
import tempfile
import unittest
from unittest.mock import patch
import acquire as a
import protocol as p
from admission import decision


class QualificationTests(unittest.TestCase):
    def test_hard_memory_admission(self):
        self.assertEqual(decision(12*1024**3-1,16384),'BLOCKED_REAL_INFERENCE_HOST_MEMORY')
        self.assertEqual(decision(12*1024**3,10239),'BLOCKED_REAL_INFERENCE_GPU_MEMORY')
        self.assertEqual(decision(12*1024**3,10240),'MEMORY_ADMISSION_PASSED_NOT_EXECUTION_APPROVAL')
    def test_only_two_real_evaluation_records(self):
        for ident in a.IDS:
            r = a.record(ident)
            self.assertEqual(r['decision'], 'approved-for-evaluation')
            self.assertFalse(r['production'])
        for ident in ['florence2-base-ms-v1', '../x', '/tmp/model', '', 'synthetic-test-worker']:
            with self.assertRaises(ValueError): a.record(ident)

    def test_production_and_revision_reject(self):
        rows = json.loads((a.RECORDS/'records.json').read_text())
        for key, value in [('production', True), ('decision', 'approved-for-production'), ('revision', 'main')]:
            bad = json.loads(json.dumps(rows)); bad[0][key] = value
            with patch.object(Path, 'read_text', return_value=json.dumps(bad)):
                with self.assertRaises(ValueError): a.record(a.IDS[0])

    def test_license_evidence_tamper(self):
        with patch.object(Path, 'read_bytes', return_value=b'tampered'):
            with self.assertRaises(ValueError): a.record(a.IDS[0])

    def test_host_restrictions(self):
        for url in ['http://huggingface.co/x','https://evil.com/x','https://huggingface.co.evil.com/x',
                    'https://user@huggingface.co/x','https://huggingface.co:444/x','https://127.0.0.1/x']:
            with self.assertRaises(ValueError): a.public_addresses(url, a.MODEL_HOSTS)

    def test_private_dns_rejected(self):
        for ip in ['127.0.0.1','10.1.2.3','169.254.169.254','::1','fc00::1']:
            with patch.object(socket, 'getaddrinfo', return_value=[(0,0,0,'',(ip,443))]):
                with self.assertRaises(ValueError): a.public_addresses('https://huggingface.co/x', a.MODEL_HOSTS)

    def test_frame_bounds_and_roundtrip(self):
        msg={'version':1,'task':'detection'}
        self.assertEqual(p.decode(p.encode(msg,b'abc')), (msg,b'abc'))
        for b in [b'', b'NOPE'+b'\0'*8, b'R1B1'+struct.pack('>II',p.JSON_LIMIT+1,0),
                  p.encode(msg)+b'trailing']:
            with self.assertRaises(ValueError): p.decode(b)

    def test_duplicate_and_nonfinite_json(self):
        for s in [b'{"x":1,"x":2}',b'{"x":NaN}']:
            with self.assertRaises(ValueError): p.decode(b'R1B1'+struct.pack('>II',len(s),0)+s)

    def test_result_cannot_claim_trust(self):
        m=dict(version=1,task='detection',width=16,height=16,scores=[.5],boxes=[[1,2,3,4]],scoreKind='estimated')
        p.validate_result(m,b'',16,16)
        for key in ['verified','trusted','path','absence','editingAuthorization','logs']:
            with self.assertRaises(ValueError): p.validate_result(dict(m,**{key:True}),b'',16,16)
        with self.assertRaises(ValueError): p.validate_result(dict(m,scoreKind='verified'),b'',16,16)
        with self.assertRaises(ValueError): p.validate_result(dict(m,boxes=[[0,0,17,16]]),b'',16,16)
        with self.assertRaises(ValueError): p.validate_result(dict(m,scores=[float('nan')]),b'',16,16)

    def test_mask_dimensions_and_values(self):
        m=dict(version=1,task='segmentation',width=2,height=2,scores=[.8],boxes=[],scoreKind='estimated')
        p.validate_result(m,b'\0\1\0\1',2,2)
        for b in [b'\0',b'\0\1\0\2']:
            with self.assertRaises(ValueError): p.validate_result(m,b,2,2)

    def test_cache_tamper_missing_and_manifest_no_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/'x'; spec=dict(filename='x',bytes=3,sha256=a.digest(b'abc'))
            with self.assertRaises(FileNotFoundError): a.verify(f,spec)
            f.write_bytes(b'abc'); a.verify(f,spec)
            f.write_bytes(b'abd')
            with self.assertRaises(ValueError): a.verify(f,spec)
            m=Path(d)/'manifest.json'; a.publish_json(m,{'a':1}); a.publish_json(m,{'a':1})
            with self.assertRaises(ValueError): a.publish_json(m,{'a':2})
            self.assertEqual(json.loads(m.read_text()),{'a':1})

    def test_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/'real'; f.write_bytes(b'x'); link=Path(d)/'link'
            try: link.symlink_to(f)
            except OSError: self.skipTest('OS symlink creation unavailable')
            with self.assertRaises(ValueError): a.safe_path(link)

    def test_wrong_revision_manifest(self):
        with tempfile.TemporaryDirectory() as d:
            r = dict(id=a.IDS[0], revision='a'*40, files=[])
            folder=Path(d)/'models'/r['id']/r['revision']; folder.mkdir(parents=True)
            (folder/'acquisition.json').write_text(json.dumps(dict(recordId=r['id'],revision='b'*40,
                recordSha256=a.digest(json.dumps(r,sort_keys=True).encode()),files=[])))
            with patch.object(a,'CACHE',Path(d)), patch.object(a,'record',return_value=r):
                with self.assertRaises(ValueError): a.verify_bundle(r['id'])

    def test_windows_reparse_attribute_rejected(self):
        from types import SimpleNamespace
        with patch.object(Path,'lstat',return_value=SimpleNamespace(st_mode=0o100600,st_file_attributes=0x400)):
            with self.assertRaises(ValueError): a.safe_path(Path('junction'))

    def test_safetensors_header_and_ranges(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/'tensor.safetensors'
            header=json.dumps({'x':dict(dtype='U8',shape=[2],data_offsets=[0,2])}).encode()
            f.write_bytes(struct.pack('<Q',len(header))+header+b'\0\1'); a.check_safetensors(f)
            f.write_bytes(b'pickle-not-a-tensor')
            with self.assertRaises(ValueError): a.check_safetensors(f)

    def test_download_oversize_never_publishes(self):
        class Connection:
            def close(self): pass
        class Response(io.BytesIO):
            def getheader(self,_): return None
        with tempfile.TemporaryDirectory() as d, patch.object(a,'response',return_value=(Connection(),Response(b'abcd'))):
            f=Path(d)/'x'
            with self.assertRaises(ValueError): a.download('https://huggingface.co/x',f,dict(filename='x',bytes=3,sha256=a.digest(b'abc')),a.MODEL_HOSTS)
            self.assertFalse(f.exists()); self.assertEqual(list(Path(d).iterdir()),[])

    def test_hash_locked_wheels(self):
        root=a.REPO/'scripts/staging_runtime'
        rows=json.loads((root/'wheels.lock.json').read_text())
        expected=''.join(x['name']+'=='+x['version']+' --hash=sha256:'+x['sha256']+'\n' for x in rows)
        self.assertEqual((root/'requirements.lock').read_text(),expected)
        self.assertEqual(len(rows),55)
        self.assertEqual(len({x['name'] for x in rows}),55)
        for r in rows:
            self.assertRegex(r['sha256'],r'^[a-f0-9]{64}$')
            self.assertGreater(r['bytes'],0)
            self.assertTrue(r['filename'].endswith('.whl'))


if __name__=='__main__': unittest.main()
