from unittest.mock import patch

from django.test import TestCase

from .models import Product, ProductImage


class ProductImageStorageTests(TestCase):
	def setUp(self):
		self.product = Product.objects.create(
			name="Test product",
			description="",
			price="1.00",
		)
		self.storage = ProductImage._meta.get_field("image").storage

	def test_deleting_image_row_deletes_stored_file(self):
		image = ProductImage.objects.create(
			product=self.product,
			image="products/example.jpg",
		)

		with patch.object(self.storage, "delete") as delete_file:
			image.delete()

		delete_file.assert_called_once_with("products/example.jpg")

	def test_clearing_inline_image_deletes_stored_file(self):
		image = ProductImage.objects.create(
			product=self.product,
			image="products/example.jpg",
		)

		with patch.object(self.storage, "delete") as delete_file:
			image.image = ""
			image.save(update_fields=["image"])

		delete_file.assert_called_once_with("products/example.jpg")
