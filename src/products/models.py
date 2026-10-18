from pathlib import Path

from django.core.exceptions import ValidationError
from django.db import models
from PIL import Image as PillowImage
from PIL import UnidentifiedImageError

from .supabase_storage import SupabaseStorage


def validate_product_image(image):
    if image.size > 5 * 1024 * 1024:
        raise ValidationError("Image files must be 5 MB or smaller.")

    if Path(image.name).suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise ValidationError("Only JPG, PNG, and WEBP images are allowed.")

    try:
        image.seek(0)
        with PillowImage.open(image) as uploaded_image:
            if uploaded_image.format not in {"JPEG", "PNG", "WEBP"}:
                raise ValidationError("Only JPG, PNG, and WEBP images are allowed.")
            uploaded_image.verify()
    except (UnidentifiedImageError, OSError, SyntaxError) as error:
        raise ValidationError("Upload a valid JPG, PNG, or WEBP image.") from error
    finally:
        image.seek(0)



class Car(models.Model):
    BRAND_CHOICES = [
        ("saipa", "سایپا"),
        ("iran_khodro", "ایران‌خودرو"),
        ("other", "ماشین‌های دیگر"),
    ]

    name = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    brand = models.CharField(max_length=32, choices=BRAND_CHOICES)
    

    def __str__(self):
        return f"{self.name} {self.model} ({self.brand})"




class Product(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=500)
    cars = models.ManyToManyField(Car, related_name="products")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    
    image = models.ImageField(
        upload_to="products/",
        storage=SupabaseStorage(),
        blank=True,
        validators=[validate_product_image],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Image for {self.product.name}"