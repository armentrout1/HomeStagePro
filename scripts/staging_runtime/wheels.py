"""Acquire pinned wheels without installing or executing their code."""
import json
import zipfile
from acquire import CACHE, REPO, WHEEL_HOSTS, digest, download, publish_json, safe_path, private_root


def acquire_wheels():
    private_root()
    lock = REPO / 'scripts/staging_runtime/wheels.lock.json'
    rows = json.loads(lock.read_text())
    directory = safe_path(CACHE / 'wheels')
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    receipts = []
    for r in rows:
        if '/' in r['filename'] or '\\' in r['filename'] or not r['filename'].endswith('.whl'):
            raise ValueError('WHEEL_FILENAME_INVALID')
        receipt = download(r['url'], directory / r['filename'], r, WHEEL_HOSTS)
        with zipfile.ZipFile(directory / r['filename']) as archive:
            notices = []
            for item in archive.infolist():
                if any(x in item.filename.lower() for x in ['license', 'notice', 'copying']) and not item.is_dir():
                    if item.file_size > 8*1024*1024:
                        raise ValueError('NOTICE_SIZE_INVALID')
                    data = archive.read(item)
                    notices.append(dict(member=item.filename, bytes=len(data), sha256=digest(data)))
            receipt['notices'] = notices
        receipts.append(receipt)
        print(json.dumps({'wheel': r['filename'], 'bytes': receipt['bytes'], 'notices': len(notices)}), flush=True)
    publish_json(directory / 'acquisition.json', dict(lockSha256=digest(lock.read_bytes()), wheels=receipts))


if __name__ == '__main__':
    import sys
    try:
        if len(sys.argv) != 1:
            raise ValueError('NO_ARGUMENTS_ALLOWED')
        acquire_wheels()
    except Exception as e:
        print(json.dumps({'status': 'failed', 'errorType': type(e).__name__}), file=sys.stderr)
        sys.exit(1)
