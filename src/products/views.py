from django.db.models import Prefetch
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import CarVariant, Product, ProductImage
from .serializers import ProductListSerializer, ProductDetailSerializer


@method_decorator(cache_page(60), name="dispatch")
class ProductListView(APIView):
    def get(self, request):
        products = (
            Product.objects.all()
            .prefetch_related(
                Prefetch(
                    "car_variants",
                    queryset=CarVariant.objects.select_related("car"),
                ),
                "images",
            )
            .order_by("id")
        )
        serializer = ProductListSerializer(products, many=True)
        response = Response(serializer.data)
        response["Cache-Control"] = "public, max-age=30, stale-while-revalidate=300"
        return response


class ProductDetailView(APIView):
    def get(self, request, pk):
        product = get_object_or_404(
            Product.objects.prefetch_related(
                Prefetch(
                    "car_variants",
                    queryset=CarVariant.objects.select_related("car"),
                ),
                "images",
            ),
            pk=pk,
        )
        serializer = ProductDetailSerializer(product)
        return Response(serializer.data)
