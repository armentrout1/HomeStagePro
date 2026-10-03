"""Synthetic Docker isolation qualification. Never loads a real model."""
import json
import os
import shutil
import subprocess
import threading
import time
import uuid
from acquire import CACHE, safe_path

SYNTHETIC_IMAGE = 'node@sha256:9a2ed90cd91b1f3412affe080b62e69b057ba8661d9844e143a6bbd76a23260f'
PYTHON_IMAGE = 'sha256:fa3d2775b699b548515cc11efb615102d46d642b463a2d513930b6e84fc99c29'
DOCKER = shutil.which('docker')
ENV = {k: v for k, v in os.environ.items() if k.upper() in
       ('PATH', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'USERPROFILE', 'PROGRAMDATA')}


def cli(args, **kwargs):
    return subprocess.run([DOCKER, *args], env=ENV, capture_output=True, timeout=30, **kwargs)


def run_synthetic(code, timeout=15, cancel=None, python=False):
    """Code is internal synthetic test material, never a model/request input."""
    name = 'roomstager-r14b1-' + uuid.uuid4().hex
    mount = safe_path(CACHE / 'isolation-empty-cache')
    mount.mkdir(parents=True, exist_ok=True)
    args = ['run', '--pull=never', '--name', name, '--network', 'none', '--read-only',
            '--user', '65534:65534', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
            '--memory', '8g', '--memory-swap', '8g', '--cpus', '2', '--pids-limit', '64',
            '--tmpfs', '/tmp:rw,noexec,nosuid,size=67108864', '--gpus', 'all',
            '--mount', 'type=bind,source='+str(mount)+',target=/models,readonly',
            '--entrypoint', 'python' if python else 'node',
            PYTHON_IMAGE if python else SYNTHETIC_IMAGE, '-c' if python else '-e', code]
    process = subprocess.Popen([DOCKER, *args], env=ENV, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, errors, overflow = bytearray(), bytearray(), threading.Event()
    def collect(stream, target, limit):
        while True:
            data = stream.read(4096)
            if not data:
                break
            if len(target)+len(data) > limit:
                overflow.set()
                break
            target.extend(data)
    readers = [threading.Thread(target=collect, args=(process.stdout, output, 1024*1024), daemon=True),
               threading.Thread(target=collect, args=(process.stderr, errors, 65536), daemon=True)]
    for thread in readers:
        thread.start()
    start, state = time.monotonic(), 'completed'
    try:
        while process.poll() is None:
            if overflow.is_set():
                state = 'output-limit'; break
            if cancel is not None and cancel.is_set():
                state = 'cancelled'; break
            if time.monotonic()-start > timeout:
                state = 'timed-out'; break
            time.sleep(.05)
        if state != 'completed':
            cli(['kill', name])
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill(); process.wait(timeout=5)
    finally:
        # This removes the container itself, not merely its attached CLI process.
        cli(['rm', '-f', name])
        for thread in readers:
            thread.join(timeout=2)
        process.stdout.close(); process.stderr.close()
        if cli(['inspect', name]).returncode == 0:
            raise RuntimeError('CONTAINER_CLEANUP_FAILED')
    if overflow.is_set():
        state = 'output-limit'
    return dict(status=state, exitCode=process.returncode, stdout=bytes(output).decode(errors='replace'),
                stderrBytes=len(errors), containerRemoved=True)


PROBE = r"""
const fs = require('fs'), dns=require('dns').promises, net=require('net');
(async()=>{
const denied = p => {try {fs.writeFileSync(p,'probe'); return false;}catch {return true;}};
let dnsDenied=false;try {await dns.lookup('example.com');}catch {dnsDenied=true;}
const httpDenied=await new Promise(resolve=>{const s=net.connect(80,'1.1.1.1');
s.setTimeout(1500);s.on('connect',()=>{s.destroy();resolve(false)});
s.on('error',()=>resolve(true));s.on('timeout',()=>{s.destroy();resolve(true)});});
const cgroup = p => fs.readFileSync('/sys/fs/cgroup/'+p,'utf8').trim();
const report={uid:process.getuid(),rootDenied:denied('/probe-write'),cacheDenied:denied('/models/probe-write'),
socketAbsent:!fs.existsSync('/var/run/docker.sock'),dnsDenied,httpDenied,
capEff:fs.readFileSync('/proc/self/status','utf8').match(/^CapEff:\s+(\w+)/m)[1],
memoryMax:cgroup('memory.max'),cpuMax:cgroup('cpu.max'),
tmpMount:fs.readFileSync('/proc/mounts','utf8').split('\n').find(x=>x.split(' ')[1]==='/tmp'),
secretVariables:Object.keys(process.env).filter(k=>/proxy|api.?key|secret|token|password/i.test(k))};
console.log(JSON.stringify(report));
})();
"""

PYTHON_PROBE = r"""
import os,socket,json,pathlib
def denied(p):
 try: pathlib.Path(p).write_text('probe'); return False
 except OSError: return True
def connection_denied():
 try:
  with socket.create_connection(('1.1.1.1',80),timeout=1.5): return False
 except OSError: return True
try: socket.getaddrinfo('example.com',443); dns_denied=False
except OSError: dns_denied=True
print(json.dumps(dict(uid=os.getuid(),rootDenied=denied('/probe-write'),cacheDenied=denied('/models/probe-write'),
 dnsDenied=dns_denied,httpDenied=connection_denied(),socketAbsent=not pathlib.Path('/var/run/docker.sock').exists(),
 memoryMax=pathlib.Path('/sys/fs/cgroup/memory.max').read_text().strip(),
 cpuMax=pathlib.Path('/sys/fs/cgroup/cpu.max').read_text().strip(),
 secretVariables=[k for k in os.environ if any(x in k.lower() for x in ('proxy','api_key','secret','token','password'))])))
"""


def qualify():
    before = cli(['run', '--rm', '--pull=never', '--network', 'none', '--gpus', 'all',
                  '--entrypoint', 'nvidia-smi', SYNTHETIC_IMAGE,
                  '--query-compute-apps=pid,process_name,used_memory', '--format=csv']).stdout.decode()
    probe = run_synthetic(PROBE)
    if probe['exitCode'] != 0 or probe['status'] != 'completed':
        raise RuntimeError('ISOLATION_PROBE_FAILED')
    observed = json.loads(probe['stdout'])
    assert observed['uid'] == 65534 and observed['capEff'] == '0000000000000000'
    assert all(observed[k] for k in ('rootDenied', 'cacheDenied', 'socketAbsent', 'dnsDenied', 'httpDenied'))
    assert observed['memoryMax'] == str(8*1024**3) and observed['cpuMax'] == '200000 100000'
    assert not observed['secretVariables'] and 'size=65536k' in observed['tmpMount']
    hanging = "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"
    timed = run_synthetic(hanging, timeout=3)
    event = threading.Event(); timer = threading.Timer(3, event.set); timer.start()
    cancelled = run_synthetic(hanging, cancel=event); timer.join()
    oversized = run_synthetic("process.stdout.write('x'.repeat(2*1024*1024));setInterval(()=>{},1000)")
    assert timed['status']=='timed-out' and cancelled['status']=='cancelled' and oversized['status']=='output-limit'
    py = run_synthetic(PYTHON_PROBE, python=True)
    assert py['exitCode']==0 and py['status']=='completed'
    py_observed=json.loads(py['stdout'])
    assert py_observed['uid']==65534 and not py_observed['secretVariables']
    assert all(py_observed[k] for k in ('rootDenied','cacheDenied','socketAbsent','dnsDenied','httpDenied'))
    assert py_observed['memoryMax']==str(8*1024**3) and py_observed['cpuMax']=='200000 100000'
    py_timeout=run_synthetic('import time; time.sleep(60)',timeout=3,python=True)
    event=threading.Event(); timer=threading.Timer(3,event.set); timer.start()
    py_cancel=run_synthetic('import time; time.sleep(60)',cancel=event,python=True); timer.join()
    assert py_timeout['status']=='timed-out' and py_cancel['status']=='cancelled'
    after = cli(['run', '--rm', '--pull=never', '--network', 'none', '--gpus', 'all',
                 '--entrypoint', 'nvidia-smi', SYNTHETIC_IMAGE,
                 '--query-compute-apps=pid,process_name,used_memory', '--format=csv']).stdout.decode()
    result = dict(image=SYNTHETIC_IMAGE, isolation=observed,
                  pythonImage=PYTHON_IMAGE, pythonIsolation=py_observed,
                  pythonTimeout={k:v for k,v in py_timeout.items() if k!='stdout'},
                  pythonCancellation={k:v for k,v in py_cancel.items() if k!='stdout'},
                  timeout={k:v for k,v in timed.items() if k!='stdout'},
                  cancellation={k:v for k,v in cancelled.items() if k!='stdout'},
                  outputLimit={k:v for k,v in oversized.items() if k!='stdout'},
                  gpuProcessesBefore=before, gpuProcessesAfter=after,
                  limitation='Synthetic probe uses nvidia-smi only; no CUDA kernel/model or VRAM hard isolation proven.')
    (CACHE/'isolation-result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))


if __name__ == '__main__':
    qualify()
