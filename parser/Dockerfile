# ── Stage 1: Dependencies ─────────────────────────────────────────
FROM python:3.11-slim AS base

# Java is required by tabula-py (openbk dependency)
RUN apt-get update && apt-get install -y \
    default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM base AS runtime

WORKDIR /app

# Non-root user
RUN useradd -m -u 1000 appuser

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 2028

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:2028/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "2028", "--workers", "1"]