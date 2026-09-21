FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY pyproject.toml README.md ./

RUN python -m pip install --upgrade pip \
    && pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.13.0

COPY src ./src
COPY scripts ./scripts

# Fail the production image build if transient provider errors are not surfaced.
RUN test "$(grep -c AgentProviderError src/agent/executor.py)" -gt 0

RUN pip install --no-cache-dir .

USER app

EXPOSE 8000

CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT}"]
