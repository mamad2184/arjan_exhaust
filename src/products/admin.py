from django.contrib import admin
from .models import Car, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline]

    filter_horizontal = ("car",)

    list_display = ("name", "price", "created_at")
    search_fields = ("name", "description")
    list_filter = ("car__brand",)


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ("name", "brand")
    search_fields = ("name",)
    list_filter = ("brand",)


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "created_at")