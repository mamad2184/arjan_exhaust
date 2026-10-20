from urllib.parse import urlsplit

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.deconstruct import deconstructible
from storages.backends.s3 import S3Storage


@deconstructible
class SupabaseS3Storage(S3Storage):
    def __init__(self):
        supabase_host = urlsplit(settings.SUPABASE_URL).netloc
        public_domain = (
            f"{supabase_host}/storage/v1/object/public/"
            f"{settings.SUPABASE_S3_BUCKET}"
        )

        super().__init__(
            access_key=settings.SUPABASE_S3_ACCESS_KEY_ID,
            secret_key=settings.SUPABASE_S3_SECRET_ACCESS_KEY,
            bucket_name=settings.SUPABASE_S3_BUCKET,
            endpoint_url=settings.SUPABASE_S3_ENDPOINT_URL,
            region_name=settings.SUPABASE_S3_REGION,
            addressing_style="path",
            signature_version="s3v4",
            querystring_auth=False,
            custom_domain=public_domain,
            url_protocol="https:",
            file_overwrite=False,
        )

    def _ensure_configured(self):
        required_settings = {
            "SUPABASE_S3_ENDPOINT_URL": settings.SUPABASE_S3_ENDPOINT_URL,
            "SUPABASE_S3_REGION": settings.SUPABASE_S3_REGION,
            "SUPABASE_S3_ACCESS_KEY_ID": settings.SUPABASE_S3_ACCESS_KEY_ID,
            "SUPABASE_S3_SECRET_ACCESS_KEY": settings.SUPABASE_S3_SECRET_ACCESS_KEY,
        }
        missing_settings = [
            name for name, value in required_settings.items() if not value
        ]
        if missing_settings:
            raise ImproperlyConfigured(
                "Set these environment variables to upload images with "
                f"Supabase S3: {', '.join(missing_settings)}."
            )

    def get_available_name(self, name, max_length=None):
        self._ensure_configured()
        return super().get_available_name(name, max_length=max_length)

    def _save(self, name, content):
        self._ensure_configured()
        return super()._save(name, content)