import os
import uuid
from pathlib import Path

import httpx
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

BUCKET_NAME = "product-images"


@deconstructible
class SupabaseStorage(Storage):
    def _settings(self):
        return (
            os.environ["SUPABASE_URL"].rstrip("/"),
            os.environ["SUPABASE_SECRET_KEY"],
        )

    def _save(self, name, content):
        supabase_url, secret_key = self._settings()

        extension = Path(name).suffix.lower()
        file_path = f"products/{uuid.uuid4().hex}{extension}"
        url = (
            f"{supabase_url}/storage/v1/object/"
            f"{BUCKET_NAME}/{file_path}"
        )

        headers = {
            "Authorization": f"Bearer {secret_key}",
            "apikey": secret_key,
            "Content-Type": getattr(
                content, "content_type", None
            ) or "application/octet-stream",
        }

        content.seek(0)
        response = httpx.post(
            url,
            headers=headers,
            content=content.read(),
            timeout=30.0,
        )
        response.raise_for_status()

        return file_path

    def delete(self, name):
        supabase_url, secret_key = self._settings()
        url = (
            f"{supabase_url}/storage/v1/object/"
            f"{BUCKET_NAME}/{name}"
        )

        headers = {
            "Authorization": f"Bearer {secret_key}",
            "apikey": secret_key,
        }

        response = httpx.delete(url, headers=headers, timeout=30.0)
        response.raise_for_status()

    def exists(self, name):
        # Filenames are UUID-based and generated in _save().
        return False

    def url(self, name):
        supabase_url, _ = self._settings()
        return (
            f"{supabase_url}/storage/v1/object/public/"
            f"{BUCKET_NAME}/{name}"
        )