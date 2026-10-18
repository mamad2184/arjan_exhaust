
from rest_framework import serializers
from .models import Product, Car, ProductImage


class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price"]


class ProductDetailSerializer(serializers.ModelSerializer):
    cars = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    images = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

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