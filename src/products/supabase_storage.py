import os
import uuid
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
BUCKET_NAME = "product-images"


def upload_image(file):
    extension = Path(file.name).suffix.lower()
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    if extension not in allowed_extensions:
        raise ValueError("Only JPG, PNG, and WEBP images are allowed.")

    content_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }[extension]

    file_path = f"{uuid.uuid4().hex}{extension}"
    url = (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{BUCKET_NAME}/{file_path}"
    )

    headers = {
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "apikey": SUPABASE_SECRET_KEY,
        "Content-Type": content_type,
    }

    file.seek(0)

    response = httpx.post(
        url,
        headers=headers,
        content=file.read(),
        timeout=30.0,
    )
    response.raise_for_status()

    return (
        f"{SUPABASE_URL}/storage/v1/object/public/"
        f"{BUCKET_NAME}/{file_path}"
    )