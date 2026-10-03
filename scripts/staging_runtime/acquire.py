"""Operator-only, exact-record acquisition. No model imports or inference here."""
import hashlib
import base64
import http.client
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
import ssl
import stat
import struct
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlsplit, urljoin, quote

REPO = Path(__file__).resolve().parents[2]
RECORDS = REPO / 'licenses/staging-components/real-local'
CACHE = REPO / '.model-cache/r14b1'
IDS = ('grounding-dino-tiny-hf-v1', 'sam21-small-hf-v1')
# Reviewed 2026-10-02 against https://huggingface.co/docs/hub/models-downloading.
# Only the observed CDN is enabled; no suffix/wildcard or dynamic host discovery.
MODEL_HOSTS = frozenset(('huggingface.co', 'us.aws.cdn.hf.co'))
WHEEL_HOSTS = frozenset(('files.pythonhosted.org', 'download.pytorch.org'))


def private_root():
    root = safe_path(CACHE)
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    if os.name == 'nt':
        # Fixed script/path; no caller-supplied PowerShell or filesystem target.
        script = "$p = '" + str(root).replace("'", "''") + "';" + """$ErrorActionPreference='Stop'; $acl = [System.IO.Directory]::GetAccessControl($p);
$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User;
$allowed = @($sid.Value, 'S-1-5-18');
if (-not $acl.AreAccessRulesProtected) { exit 2 };
foreach ($r in $acl.Access) {
 if ($r.AccessControlType -eq 'Allow' -and $allowed -notcontains $r.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value) { exit 3 }
}; exit 0"""
        # Cache initialization is deliberately an explicit documented operator step.
        exe = Path(os.environ['SystemRoot'])/'System32/WindowsPowerShell/v1.0/powershell.exe'
        result = subprocess.run([str(exe), '-NoProfile', '-NonInteractive', '-EncodedCommand',
                                 base64.b64encode(script.encode('utf-16-le')).decode()],
                                capture_output=True, timeout=15)
        if result.returncode:
            raise ValueError('PRIVATE_CACHE_ACL_REQUIRED')
    elif root.stat().st_mode & 0o077:
        raise ValueError('PRIVATE_CACHE_MODE_REQUIRED')
    return root


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(path):
    """Private owner-controlled tree; never follow a symlink or Windows reparse point."""
    path = Path(os.path.abspath(path))
    for part in [*reversed(path.parents), path]:
        try:
            s = part.lstat()
        except FileNotFoundError:
            continue
        if stat.S_ISLNK(s.st_mode) or getattr(s, 'st_file_attributes', 0) & 0x400:
            raise ValueError('CACHE_REPARSE_POINT')
    return path


def record(ident):
    if ident not in IDS:
        raise ValueError('IMPLEMENTATION_NOT_REGISTERED')
    rows = json.loads((RECORDS / 'records.json').read_text())
    if len(rows) != 2 or {r['id'] for r in rows} != set(IDS):
        raise ValueError('LICENSE_RECORD_INVALID')
    r = next(r for r in rows if r['id'] == ident)
    if (r['decision'] != 'approved-for-evaluation' or r['production'] is not False
            or r['redistribution'] is not False
            or r['trainingProvenance'] != 'unresolved-production-blocker'
            or not re.fullmatch('[a-f0-9]{40}', r['revision'])):
        raise ValueError('LICENSE_RECORD_INVALID')
    for e in r['evidence']:
        if '/' in e['filename'] or '\\' in e['filename']:
            raise ValueError('LICENSE_RECORD_INVALID')
        if digest(safe_path(RECORDS / e['filename']).read_bytes()) != e['sha256']:
            raise ValueError('LICENSE_EVIDENCE_MISMATCH')
    names = set()
    for f in r['files']:
        if (not re.fullmatch('[A-Za-z0-9_.-]+', f['filename']) or f['filename'] in ('.', '..')
                or f['filename'] in names or not re.fullmatch('[a-f0-9]{64}', f['sha256'])
                or type(f['bytes']) is not int or not 0 < f['bytes'] < 1024**3
                or f['filename'].endswith(('.pt', '.pth', '.bin', '.py'))):
            raise ValueError('ARTIFACT_RECORD_INVALID')
        names.add(f['filename'])
    return r


def public_addresses(url, hosts):
    p = urlsplit(url)
    if (p.scheme != 'https' or p.hostname not in hosts or p.username or p.password
            or p.port not in (None, 443) or p.fragment):
        raise ValueError('DOWNLOAD_HOST_BLOCKED')
    addresses = sorted({x[4][0] for x in socket.getaddrinfo(p.hostname, 443, type=socket.SOCK_STREAM)})
    if not addresses or any(not ipaddress.ip_address(a).is_global for a in addresses):
        raise ValueError('DOWNLOAD_ADDRESS_BLOCKED')
    return p, addresses


class PinnedHTTPS(http.client.HTTPSConnection):
    def __init__(self, host, address, timeout):
        super().__init__(host, timeout=timeout, context=ssl.create_default_context())
        self.address = address

    def connect(self):
        # Pin the validated IP while preserving certificate/SNI hostname verification.
        raw = socket.create_connection((self.address, 443), self.timeout)
        try:
            self.sock = self._context.wrap_socket(raw, server_hostname=self.host)
        except BaseException:
            raw.close()
            raise


def response(url, hosts, deadline):
    for _ in range(6):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('DOWNLOAD_TIMEOUT')
        p, addresses = public_addresses(url, hosts)
        conn = PinnedHTTPS(p.hostname, addresses[0], min(30, remaining))
        try:
            conn.request('GET', p.path + ('?' + p.query if p.query else ''),
                         headers={'Accept-Encoding': 'identity', 'User-Agent': 'RoomStager-R1-evaluation'})
            res = conn.getresponse()
            if res.status in (301, 302, 303, 307, 308):
                location = res.getheader('Location')
                if not location:
                    raise ValueError('DOWNLOAD_REDIRECT_INVALID')
                url = urljoin(url, location)
                conn.close()
                continue
            if res.status != 200 or res.getheader('Content-Encoding') not in (None, 'identity'):
                raise ValueError('DOWNLOAD_HTTP_REJECTED')
            return conn, res
        except BaseException:
            conn.close()
            raise
    raise ValueError('DOWNLOAD_REDIRECT_LIMIT')


def verify(path, spec):
    path = safe_path(path)
    flags = os.O_RDONLY | getattr(os, 'O_BINARY', 0) | getattr(os, 'O_NOFOLLOW', 0)
    with os.fdopen(os.open(path, flags), 'rb') as stream:
        s = os.fstat(stream.fileno())
        if not stat.S_ISREG(s.st_mode) or s.st_size != spec['bytes']:
            raise ValueError('ARTIFACT_SIZE_MISMATCH')
        h = hashlib.sha256()
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    if h.hexdigest() != spec['sha256']:
        raise ValueError('ARTIFACT_HASH_MISMATCH')
    if spec['filename'].endswith('.safetensors'):
        check_safetensors(path)
    return {'filename': spec['filename'], 'bytes': s.st_size, 'sha256': h.hexdigest()}


def check_safetensors(path):
    with safe_path(path).open('rb') as stream:
        prefix = stream.read(8)
        if len(prefix) != 8:
            raise ValueError('SAFETENSORS_HEADER_INVALID')
        n = struct.unpack('<Q', prefix)[0]
        if not 2 <= n <= 32 * 1024 * 1024:
            raise ValueError('SAFETENSORS_HEADER_INVALID')
        def unique(pairs):
            d = {}
            for k, v in pairs:
                if k in d:
                    raise ValueError('SAFETENSORS_DUPLICATE_KEY')
                d[k] = v
            return d
        header = json.loads(stream.read(n), object_pairs_hook=unique)
        extent = path.stat().st_size - 8 - n
        sizes = dict(BOOL=1, U8=1, I8=1, I16=2, U16=2, F16=2, BF16=2,
                     I32=4, U32=4, F32=4, I64=8, U64=8, F64=8)
        ranges = []
        for k, v in header.items():
            if k == '__metadata__':
                continue
            if set(v) != {'dtype', 'shape', 'data_offsets'} or v['dtype'] not in sizes:
                raise ValueError('SAFETENSORS_TENSOR_INVALID')
            count = 1
            if len(v['shape']) > 8:
                raise ValueError('SAFETENSORS_SHAPE_INVALID')
            for d in v['shape']:
                if type(d) is not int or not 0 <= d <= 1000000:
                    raise ValueError('SAFETENSORS_SHAPE_INVALID')
                count *= d
            a, b = v['data_offsets']
            if type(a) is not int or type(b) is not int or not 0 <= a <= b <= extent or b-a != count*sizes[v['dtype']]:
                raise ValueError('SAFETENSORS_RANGE_INVALID')
            ranges.append((a, b))
        end = 0
        for a, b in sorted(ranges):
            if a != end:
                raise ValueError('SAFETENSORS_RANGE_INVALID')
            end = b
        if not ranges or end != extent:
            raise ValueError('SAFETENSORS_RANGE_INVALID')


def publish_json(path, data):
    payload = (json.dumps(data, sort_keys=True, indent=2) + '\n').encode()
    path = safe_path(path)
    if path.exists():
        if path.read_bytes() != payload:
            raise ValueError('MANIFEST_ALREADY_EXISTS')
        return
    fd, tmp = tempfile.mkstemp(prefix='.partial-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(payload)
            f.flush()
            os.fsync(f.fileno())
        os.link(tmp, path)  # Atomic no-clobber publication, unlike replace().
    finally:
        os.unlink(tmp)


def download(url, path, spec, hosts):
    path = safe_path(path)
    if path.exists():
        return verify(path, spec)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    safe_path(path.parent)
    fd, tmp = tempfile.mkstemp(prefix='.partial-', dir=path.parent)
    conn = None
    try:
        deadline = time.monotonic() + 900
        conn, res = response(url, hosts, deadline)
        length = res.getheader('Content-Length')
        if length is not None and int(length) != spec['bytes']:
            raise ValueError('ARTIFACT_SIZE_MISMATCH')
        h, total = hashlib.sha256(), 0
        with os.fdopen(fd, 'wb') as f:
            fd = None
            while True:
                if time.monotonic() >= deadline:
                    raise TimeoutError('DOWNLOAD_TIMEOUT')
                chunk = res.read(min(1024*1024, spec['bytes'] + 1-total))
                if not chunk:
                    break
                total += len(chunk)
                if total > spec['bytes']:
                    raise ValueError('ARTIFACT_SIZE_MISMATCH')
                h.update(chunk)
                f.write(chunk)
            f.flush()
            os.fsync(f.fileno())
        if total != spec['bytes'] or h.hexdigest() != spec['sha256']:
            raise ValueError('ARTIFACT_HASH_OR_SIZE_MISMATCH')
        verify(Path(tmp), dict(spec, filename=spec['filename']))
        safe_path(path)
        os.link(tmp, path)
        return verify(path, spec)
    finally:
        if conn:
            conn.close()
        if fd is not None:
            os.close(fd)
        os.unlink(tmp)


def acquire(ident):
    r = record(ident)
    private_root()
    directory = safe_path(CACHE / 'models' / ident / r['revision'])
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    results = []
    for f in r['files']:
        url = 'https://huggingface.co/' + r['repository'] + '/resolve/' + r['revision'] + '/' + quote(f['filename'])
        results.append(download(url, directory / f['filename'], f, MODEL_HOSTS))
        print(json.dumps(results[-1]), flush=True)
    publish_json(directory / 'acquisition.json', dict(recordId=ident, revision=r['revision'],
                 recordSha256=digest(json.dumps(r, sort_keys=True).encode()), files=results))


def verify_bundle(ident):
    """Offline re-verification for a future admitted worker; never downloads."""
    r = record(ident)
    directory = safe_path(CACHE / 'models' / ident / r['revision'])
    manifest = json.loads(safe_path(directory / 'acquisition.json').read_text())
    expected = dict(recordId=ident, revision=r['revision'],
                    recordSha256=digest(json.dumps(r, sort_keys=True).encode()),
                    files=[verify(directory / f['filename'], f) for f in r['files']])
    if manifest != expected:
        raise ValueError('ACQUISITION_MANIFEST_MISMATCH')
    return expected


if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise ValueError('EXPECTED_REGISTERED_RECORD_ID')
        acquire(sys.argv[1])
    except Exception as e:
        # Never print exception strings containing URLs/signed query strings.
        print(json.dumps({'status': 'failed', 'errorType': type(e).__name__}), file=sys.stderr)
        sys.exit(1)
