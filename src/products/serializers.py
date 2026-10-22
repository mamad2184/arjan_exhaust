from rest_framework import serializers

from .models import Car, Product, ProductImage


class CarListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = ["id", "name", "brand"]


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image_url"]

    def get_image_url(self, obj):
        return obj.image.url if obj.image else None


class ProductListSerializer(serializers.ModelSerializer):
    cars = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "cars", "image_url"]

    def get_cars(self, obj):
        return [
            {"id": car.id, "name": car.name, "brand": car.brand}
            for car in obj.car.all()
        ]

    def get_image_url(self, obj):
        for image in obj.images.all():
            if image.image:
                return image.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    cars = serializers.SerializerMethodField()
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

    def get_cars(self, obj):
        return [
            {"id": car.id, "name": car.name, "brand": car.brand}
            for car in obj.car.all()
        ]