import logging
from pathlib import Path

from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models.signals import post_delete
from django.dispatch import receiver
from PIL import Image as PillowImage
from PIL import UnidentifiedImageError

from utils.s3_storage import SupabaseS3Storage


logger = logging.getLogger(__name__)

MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_product_image(image):
    if image.size > MAX_IMAGE_SIZE:
        raise ValidationError("Image files must be 5 MB or smaller.")

    if Path(image.name).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValidationError("Only JPG, PNG, and WEBP images are allowed.")

    try:
        image.seek(0)
        with PillowImage.open(image) as uploaded_image:
            if uploaded_image.format not in ALLOWED_FORMATS:
                raise ValidationError(
                    "Only JPG, PNG, and WEBP images are allowed."
                )
            uploaded_image.verify()

    except ValidationError:
        raise
    except (
        UnidentifiedImageError,
        PillowImage.DecompressionBombError,
        OSError,
        SyntaxError,
        ValueError,
    ) as error:
        raise ValidationError(
            "Upload a valid JPG, PNG, or WEBP image."
        ) from error
    finally:
        image.seek(0)


def delete_storage_file(storage, name):
    """Delete a stored file without undoing a successful database operation."""
    if not name:
        return

    try:
        storage.delete(name)
    except Exception:
        logger.exception("Failed to delete stored image: %s", name)


class Car(models.Model):
    BRAND_CHOICES = [
        ("saipa", "سایپا"),
        ("iran_khodro", "ایران‌خودرو"),
        ("other", "ماشین‌های دیگر"),
    ]

    name = models.CharField(max_length=100)
    brand = models.CharField(max_length=32, choices=BRAND_CHOICES)

    def __str__(self):
        return f"{self.name} ({self.get_brand_display()})"


class Product(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=500)
    car = models.ManyToManyField(
        Car,
        related_name="products",
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(
        upload_to="products/",
        storage=SupabaseS3Storage(),
        blank=True,
        validators=[validate_product_image],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Image for {self.product.name}"

    def save(self, *args, **kwargs):
        old_image_name = None
        update_fields = kwargs.get("update_fields")

        image_is_being_saved = (
            update_fields is None or "image" in update_fields
        )

        if self.pk and image_is_being_saved:
            old_image_name = (
                type(self).objects.filter(pk=self.pk)
                .values_list("image", flat=True)
                .first()
            )

        super().save(*args, **kwargs)

        new_image_name = self.image.name if self.image else ""

        if old_image_name and old_image_name != new_image_name:
            storage = self._meta.get_field("image").storage
            transaction.on_commit(
                lambda: delete_storage_file(storage, old_image_name)
            )


@receiver(post_delete, sender=ProductImage)
def delete_product_image_file(sender, instance, **kwargs):
    if instance.image and instance.image.name:
        storage = instance._meta.get_field("image").storage
        image_name = instance.image.name

        transaction.on_commit(
            lambda: delete_storage_file(storage, image_name)
        )