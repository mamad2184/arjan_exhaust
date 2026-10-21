
from django.urls import path
from .views import (
    CarListWithVariantsView,
    ProductListView,
    ProductDetailView,
)

urlpatterns = [
    path("cars/", CarListWithVariantsView.as_view(), name="car-list-with-variants"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
]
