"""Optimiza la fotografía local del banner (requiere Python y Pillow).

Uso: python scripts/prepare-hero.py RUTA_AL_ORIGINAL
La imagen original y su licencia se documentan en public/images/ATTRIBUTION.md.
"""
from pathlib import Path
import sys
from PIL import Image, ImageOps

source = Path(sys.argv[1])
destination = Path(__file__).resolve().parents[1] / 'public' / 'images'
with Image.open(source) as original:
    photo = ImageOps.exif_transpose(original).convert('RGB')
    print(f'Original: {photo.width} x {photo.height}')
    # Conserva todo el ancho, el río y la embarcación. Descarta cielo superior
    # para que el paisaje principal destaque en el panel casi cuadrado del hero.
    crop_height = min(photo.height, round(photo.width * 3 / 4))
    photo = photo.crop((0, photo.height - crop_height, photo.width, photo.height))
    for width in (960, 1920):
        output = destination / f'magdalena-barrancabermeja-{width}.webp'
        resized = photo.resize((width, round(photo.height * width / photo.width)), Image.Resampling.LANCZOS)
        resized.save(output, 'WEBP', quality=86, method=6)
        print(f'{output.name}: {resized.width} x {resized.height}, {output.stat().st_size:,} bytes')
