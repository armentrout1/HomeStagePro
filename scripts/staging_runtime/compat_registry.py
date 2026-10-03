"""Operator evaluation registry. Does not register any production SceneElement adapter."""
IMPLEMENTATIONS = ('synthetic-test-worker', 'grounding-dino-tiny-hf-v1', 'sam21-small-hf-v1')


def resolve(implementation_id):
    if implementation_id not in IMPLEMENTATIONS:
        raise ValueError('IMPLEMENTATION_NOT_REGISTERED')
    if implementation_id == 'synthetic-test-worker':
        from isolation import PYTHON_IMAGE
        return dict(implementationId=implementation_id, task='isolation-qualification',
                    runtimeImage=PYTHON_IMAGE, entrypoint='fixed-python-isolation-probe',
                    authority='none')
    from compat_host import descriptor
    return descriptor(implementation_id)


def run(implementation_id):
    resolve(implementation_id)
    if implementation_id == 'synthetic-test-worker':
        from isolation import run_synthetic, PYTHON_PROBE
        return run_synthetic(PYTHON_PROBE, python=True)
    from compat_host import run as run_real
    return run_real(implementation_id)


if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2:raise ValueError('EXPECTED_REGISTERED_IMPLEMENTATION_ID')
    print(run(sys.argv[1]))
