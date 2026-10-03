"""Host-only admission observation. Passing this does not enable a model worker."""
import ctypes
import json
import shutil
import subprocess


def decision(host_available_bytes, gpu_free_mib):
    if host_available_bytes < 12*1024**3:
        return 'BLOCKED_REAL_INFERENCE_HOST_MEMORY'
    if gpu_free_mib < 10*1024:
        return 'BLOCKED_REAL_INFERENCE_GPU_MEMORY'
    return 'MEMORY_ADMISSION_PASSED_NOT_EXECUTION_APPROVAL'


def observe():
    class MemoryStatus(ctypes.Structure):
        _fields_ = [('length', ctypes.c_ulong), ('load', ctypes.c_ulong),
                    *[(k, ctypes.c_ulonglong) for k in ('totalPhys','availPhys','totalPage','availPage','totalVirtual','availVirtual','availExtended')]]
    status=MemoryStatus(); status.length=ctypes.sizeof(status)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
        raise RuntimeError('HOST_MEMORY_UNAVAILABLE')
    gpu=subprocess.run([shutil.which('nvidia-smi'), '--query-gpu=memory.free', '--format=csv,noheader,nounits'],
                       capture_output=True, timeout=15, check=True)
    values=[int(v) for v in gpu.stdout.decode().splitlines()]
    # This qualification machine has one GPU. Multi-GPU selection needs its own reviewed policy.
    if len(values)!=1:
        raise RuntimeError('GPU_SELECTION_NOT_QUALIFIED')
    return dict(totalHostBytes=status.totalPhys, availableHostBytes=status.availPhys,
                availableGpuMiB=values[0], status=decision(status.availPhys,values[0]))


if __name__=='__main__': print(json.dumps(observe(),indent=2))
