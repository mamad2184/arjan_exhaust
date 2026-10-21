from rest_framework import serializers

from .models import Car, CarVariant, Product, ProductImage


class CarVariantListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarVariant
        fields = ["id", "model"]


class CarListSerializer(serializers.ModelSerializer):
    variants = CarVariantListSerializer(many=True, read_only=True)

    class Meta:
        model = Car
        fields = ["id", "name", "brand", "variants"]


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
        # car_variants and each variant's car are prefetched in the view.
        cars = {}
        for variant in obj.car_variants.all():
            car = variant.car
            cars[car.pk] = {"id": car.pk, "brand": car.brand}
        return list(cars.values())

    def get_image_url(self, obj):
        # Images are prefetched, so the catalog needs no per-product detail request.
        for image in obj.images.all():
            if image.image:
                return image.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    cars = serializers.SerializerMethodField()
    car_variants = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "cars",
            "car_variants",
            "price",
            "images",
            "created_at",
            "updated_at",
        ]

    def get_cars(self, obj):
        return list(dict.fromkeys(
            variant.car_id for variant in obj.car_variants.all()
        ))

    def get_car_variants(self, obj):
        return [
            {
                "id": variant.id,
                "car_id": variant.car_id,
                "car_name": variant.car.name,
                "model": variant.model,
                "brand": variant.car.brand,
            }
            for variant in obj.car_variants.all()
        ]
