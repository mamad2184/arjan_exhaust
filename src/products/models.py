from django.db import models



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
    image_url = models.URLField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Image for {self.product.name}"