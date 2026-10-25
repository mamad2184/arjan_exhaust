from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Car, Product
from .serializers import (
    CarListSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


@method_decorator(cache_page(60), name="dispatch")
class CarListView(APIView):
    def get(self, request):
        cars = Car.objects.order_by("name", "id")
        brand = request.query_params.get("brand", "").strip()

        if brand:
            valid_brands = {value for value, _ in Car.BRAND_CHOICES}
            if brand not in valid_brands:
                return Response(
                    {"detail": "Invalid brand."},
                    status=400,
                )
            cars = cars.filter(brand=brand)

        serializer = CarListSerializer(cars, many=True)
        return Response(serializer.data)


@method_decorator(cache_page(60), name="dispatch")
class ProductListView(APIView):
    def get(self, request):
        products = Product.objects.prefetch_related("car", "images")

        search = request.query_params.get("search", "").strip()
        brand = request.query_params.get("brand", "").strip()
        car_id = request.query_params.get("car", "").strip()

        if search:
            for term in search.split():
                persian_term = term.translate(
                    str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
                )

                term_query = (
                    Q(name__icontains=term)
                    | Q(description__icontains=term)
                    | Q(car__name__icontains=term)
                )

                if persian_term != term:
                    term_query |= (
                        Q(name__icontains=persian_term)
                        | Q(description__icontains=persian_term)
                        | Q(car__name__icontains=persian_term)
                    )

                products = products.filter(term_query)

        if brand:
            valid_brands = {value for value, _ in Car.BRAND_CHOICES}
            if brand not in valid_brands:
                return Response(
                    {"detail": "Invalid brand."},
                    status=400,
                )
            products = products.filter(car__brand=brand)

        if car_id:
            if not car_id.isdigit():
                return Response(
                    {"detail": "Invalid car ID."},
                    status=400,
                )
            products = products.filter(car__id=int(car_id))

        products = products.order_by("id").distinct()

        serializer = ProductListSerializer(products, many=True)
        response = Response(serializer.data)
        response["Cache-Control"] = (
            "public, max-age=30, stale-while-revalidate=300"
        )
        return response


class ProductDetailView(APIView):
    def get(self, request, pk):
        product = get_object_or_404(
            Product.objects.prefetch_related("car", "images"),
            pk=pk,
        )
        serializer = ProductDetailSerializer(product)
        return Response(serializer.data)