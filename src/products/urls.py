
from django.urls import path
from .views import (
    ProductListView,
    ProductDetailView,
    ProductImageUploadView,
)

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path("images/upload/", ProductImageUploadView.as_view(), name="image-upload"),
]
