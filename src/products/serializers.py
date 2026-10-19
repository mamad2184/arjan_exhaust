from rest_framework import serializers
from .models import Product, Car, ProductImage


class CarCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = ["id", "brand"]


class ProductListSerializer(serializers.ModelSerializer):
    cars = CarCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "price", "cars"]


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image_url"]

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    cars = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "cars",
            "price",
            "images",
            "created_at",
            "updated_at",
        ]
