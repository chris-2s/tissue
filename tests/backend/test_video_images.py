import io
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image

from app.schema import PosterCrop, VideoDetail
from app.utils import nfo
from app.utils.image import badge
from app.utils.image import crop_poster, get_right_poster_crop, save_images


def image_bytes(size: tuple[int, int], image_format: str = 'JPEG') -> bytes:
    output = io.BytesIO()
    Image.new('RGB', size, '#345678').save(output, format=image_format)
    return output.getvalue()


def test_badge_layout_scales_consistently_and_starts_below_rounded_corner():
    tag_size = (500, 250)

    assert badge._badge_box((379, 538), tag_size, 0) == (5, 12, 75, 47)
    assert badge._badge_box((379, 538), tag_size, 1) == (5, 52, 75, 87)
    assert badge._badge_box((758, 1076), tag_size, 0) == (10, 24, 150, 94)
    assert badge._badge_box((758, 1076), tag_size, 1) == (10, 104, 150, 174)


def test_badge_processing_returns_original_image_when_no_tags_are_enabled():
    image = Image.new('RGB', (379, 538), '#345678')

    assert badge.tags(image, is_zh=False, is_uncensored=False) is image


def test_crop_poster_uses_percentage_coordinates_at_source_resolution():
    image = Image.new('RGB', (800, 538), '#345678')
    crop = PosterCrop(x=52.625, y=0, width=47.375, height=100)

    result = crop_poster(image, crop)

    assert result.size == (379, 538)


def test_save_images_uses_crop_range_and_sets_real_paths(tmp_path: Path):
    video_path = tmp_path / 'ABC-123.mp4'
    video = VideoDetail(
        cover='https://example.com/cover.png',
        poster_crop=PosterCrop(x=52.625, y=0, width=47.375, height=100),
    )

    save_images(
        video,
        str(video_path),
        image_bytes((800, 538), 'PNG'),
    )

    assert video.poster == str(tmp_path / 'ABC-123-poster.png')
    assert video.thumb == str(tmp_path / 'ABC-123-thumb.png')
    assert video.fanart == str(tmp_path / 'ABC-123-fanart.png')
    with Image.open(video.poster) as poster:
        assert poster.format == 'PNG'
        assert poster.size == (379, 538)


def test_default_crop_is_right_aligned_and_uses_source_resolution(tmp_path: Path):
    video_path = tmp_path / 'ABC-123.mp4'
    video = VideoDetail(cover='https://example.com/cover.jpg')

    save_images(
        video,
        str(video_path),
        image_bytes((800, 538), 'JPEG'),
    )

    assert video.poster_crop is not None
    assert video.poster_crop.x + video.poster_crop.width == 100
    assert video.poster_crop.y == 0
    assert video.poster_crop.height == 100
    with Image.open(video.poster) as poster:
        assert poster.format == 'JPEG'
        assert poster.size == (379, 538)


def test_default_crop_centers_vertically_when_cover_is_too_narrow():
    crop = get_right_poster_crop(Image.new('RGB', (300, 600)))

    assert crop.x == 0
    assert crop.width == 100
    assert crop.y > 0
    assert crop.y * 2 + crop.height == 100


def test_nfo_save_uses_actual_image_paths(tmp_path: Path):
    nfo_path = tmp_path / 'ABC-123.nfo'
    video = VideoDetail(
        cover='https://example.com/cover.jpg?token=123',
        poster=str(tmp_path / 'custom-poster.jpg'),
        thumb=str(tmp_path / 'custom-thumb.jpg'),
        fanart=str(tmp_path / 'custom-fanart.jpg'),
        poster_crop=PosterCrop(x=52.625, y=0, width=47.375, height=100),
    )

    nfo.save(str(nfo_path), video)
    root = ET.parse(nfo_path).getroot()

    assert root.findtext('poster') == video.poster
    assert root.findtext('thumb') == video.thumb
    assert root.findtext('fanart') == video.fanart
    assert root.find('extra/poster_crop').attrib == {
        'x': '52.625000',
        'y': '0.000000',
        'width': '47.375000',
        'height': '100.000000',
    }

    loaded = nfo.get_full(str(nfo_path))
    assert loaded.poster_crop == video.poster_crop


def test_nfo_detail_only_exposes_poster_when_file_exists(tmp_path: Path):
    nfo_path = tmp_path / 'ABC-123.nfo'
    poster_path = tmp_path / 'ABC-123-poster.jpg'
    poster_path.write_bytes(image_bytes((379, 538)))
    video = VideoDetail(title='ABC-123', poster=poster_path.name)
    nfo.save(str(nfo_path), video)

    assert nfo.get_full(str(nfo_path)).poster == str(poster_path)

    poster_path.unlink()

    assert nfo.get_full(str(nfo_path)).poster is None
