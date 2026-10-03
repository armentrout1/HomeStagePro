FROM python@sha256:c0d63ec61d3a1321f8dc2d46ab6bd38465e005237c0a463712020e5d338eae25
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 HF_DATASETS_OFFLINE=1 HF_HUB_DISABLE_TELEMETRY=1
COPY requirements.lock /opt/r1/requirements.lock
RUN --mount=type=bind,from=wheels,target=/wheels,readonly --network=none python -m pip install --no-index --no-cache-dir --only-binary=:all: --find-links=/wheels --require-hashes -r /opt/r1/requirements.lock && python -m pip check
COPY protocol.py /opt/r1/protocol.py
USER 65534:65534
WORKDIR /opt/r1
# Deliberately no model entrypoint until admission and compatibility qualification.
ENTRYPOINT ["python", "-I", "-c", "raise SystemExit('REAL_MODEL_ENTRYPOINT_NOT_QUALIFIED')"]
