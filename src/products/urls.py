from django.urls import path
from .views import (
    CarListView,
    ProductListView,
    ProductDetailView,
)

urlpatterns = [
    path("cars/", CarListView.as_view(), name="car-list"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
]