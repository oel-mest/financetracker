from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import tempfile
import logging

from supabase import create_client
from parser_core import parse_pdf_file

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CIH PDF Parser", version="1.0.0")

SUPABASE_URL              = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
PORT                      = int(os.getenv("PARSER_PORT", 2028))

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


class ParseRequest(BaseModel):
    storage_path: str   # e.g. "imports/{user_id}/statement.pdf"
    year: int           # e.g. 2025 — user specifies on upload


@app.get("/health")
def health():
    return {"status": "ok", "service": "parser", "port": PORT}


@app.post("/parse")
def parse(req: ParseRequest):
    logger.info(f"Parse request: {req.storage_path} year={req.year}")

    # 1. Download PDF from Supabase Storage
    try:
        response = supabase_client.storage.from_("imports").download(req.storage_path)
    except Exception as e:
        logger.error(f"Storage download failed: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to download PDF: {str(e)}")

    if not response:
        raise HTTPException(status_code=404, detail="File not found in storage")

    # 2. Write to temp file (openbk requires a file path)
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(response)
        tmp_path = tmp.name

    # 3. Parse with openbk
    try:
        result = parse_pdf_file(tmp_path, req.year)
    except Exception as e:
        logger.error(f"Parse failed: {e}")
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {str(e)}")
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    logger.info(f"Parsed {len(result['transactions'])} transactions")
    return result