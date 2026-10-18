
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from .models import Product, ProductImage
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductImageUploadSerializer,
)
from .supabase_storage import upload_image

class ProductListView(APIView):
    def get(self, request):
        products = Product.objects.all()
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class ProductDetailView(APIView):
    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        serializer = ProductDetailSerializer(product)
        return Response(serializer.data)


class ProductImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ProductImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = get_object_or_404(
            Product,
            pk=serializer.validated_data["product_id"],
        )

        image = serializer.validated_data["image"]
        image_url = upload_image(image)

        product_image = ProductImage.objects.create(
            product=product,
            image_url=image_url,
        )

        return Response(
            {
                "id": product_image.id,
                "product_id": product.id,
                "image_url": product_image.image_url,
            },
            status=status.HTTP_201_CREATED,
        )