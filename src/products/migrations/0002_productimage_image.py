import products.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="productimage",
            name="image_url",
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="productimage",
            name="image",
            field=models.ImageField(
                blank=True,
                storage=products.models.SupabaseStorage(),
                upload_to="products/",
                validators=[products.models.validate_product_image],
            ),
        ),
    ]