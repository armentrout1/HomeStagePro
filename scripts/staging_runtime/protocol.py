"""Compatibility-only framing; no SceneElement or trusted evidence publication."""
import json
import math
import struct

MAGIC = b'R1B1'
JSON_LIMIT = 1024 * 1024
BINARY_LIMIT = 32 * 1024 * 1024


def encode(metadata, binary=b''):
    data = json.dumps(metadata, allow_nan=False, separators=(',', ':')).encode()
    if len(data) > JSON_LIMIT or len(binary) > BINARY_LIMIT:
        raise ValueError('FRAME_LIMIT')
    return MAGIC + struct.pack('>II', len(data), len(binary)) + data + binary


def decode(data):
    if len(data) < 12 or data[:4] != MAGIC:
        raise ValueError('FRAME_HEADER')
    j, b = struct.unpack('>II', data[4:12])
    if j > JSON_LIMIT or b > BINARY_LIMIT or len(data) != 12+j+b:
        raise ValueError('FRAME_LIMIT_OR_LENGTH')
    def pairs(items):
        result = {}
        for k, v in items:
            if k in result:
                raise ValueError('FRAME_DUPLICATE_KEY')
            result[k] = v
        return result
    def invalid(_):
        raise ValueError('FRAME_NONFINITE')
    obj = json.loads(data[12:12+j], object_pairs_hook=pairs, parse_constant=invalid)
    if not isinstance(obj, dict):
        raise ValueError('FRAME_OBJECT_REQUIRED')
    return obj, data[12+j:]


def validate_result(metadata, binary, width, height):
    # Exact keys prohibit paths, logs, authority/verification and absence claims.
    if set(metadata) != {'version', 'task', 'width', 'height', 'scores', 'boxes', 'scoreKind'}:
        raise ValueError('RESULT_KEYS')
    if (metadata['version'] != 1 or metadata['scoreKind'] != 'estimated'
            or metadata['width'] != width or metadata['height'] != height
            or metadata['task'] not in ('detection', 'segmentation')):
        raise ValueError('RESULT_METADATA')
    scores, boxes = metadata['scores'], metadata['boxes']
    if not isinstance(scores, list) or len(scores) > 128 or not isinstance(boxes, list) or len(boxes) > 128:
        raise ValueError('RESULT_LIMIT')
    if any(type(s) not in (int, float) or not math.isfinite(s) or not 0 <= s <= 1 for s in scores):
        raise ValueError('RESULT_SCORE')
    for box in boxes:
        if (not isinstance(box, list) or len(box) != 4
                or any(type(v) not in (int, float) or not math.isfinite(v) for v in box)
                or not (0 <= box[0] <= box[2] <= width and 0 <= box[1] <= box[3] <= height)):
            raise ValueError('RESULT_BOX')
    if metadata['task'] == 'detection':
        if binary or len(scores) != len(boxes):
            raise ValueError('RESULT_DETECTION')
    elif len(scores) != 1 or boxes or len(binary) != width*height or any(v not in (0, 1) for v in binary):
        raise ValueError('RESULT_MASK')
