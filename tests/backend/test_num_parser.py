import pytest

from app.utils.num_parser import parse, parse_extra, parse_num
from app.utils.media_matcher import detect_flags_with_tag_priority


@pytest.mark.parametrize(
    ('name', 'expected_num'),
    [
        ('CAWD-621', 'CAWD-621'),
        ('CAWD-621-C', 'CAWD-621'),
        ('carib-020924-001-FHD', '020924-001'),
        ('midv-639ch', 'MIDV-639'),
        ('MIDV- 653- UC', 'MIDV-653'),
    ],
)
def test_parse_num_supported_cases(name: str, expected_num: str):
    assert parse_num(name) == expected_num


@pytest.mark.parametrize(
    ('name', 'expected_flags'),
    [
        ('MIDV-639-UC', (True, True)),
        ('WSA-001-UC', (True, True)),
        ('MIDV-639CH', (True, False)),
        ('MVSD-598-uncensored-HD', (False, True)),
    ],
)
def test_parse_extra_supported_cases(name: str, expected_flags: tuple[bool, bool]):
    assert parse_extra(name) == expected_flags


def test_parse_returns_video_detail_from_path():
    video = parse("/videos/midv-639ch.mp4")

    assert video is not None
    assert video.num == "MIDV-639"
    assert video.is_zh is True
    assert video.is_uncensored is False


def test_parse_returns_none_when_number_cannot_be_identified():
    assert parse("/videos/examplefile.mp4") is None


def test_parse_prefers_cleaner_parent_candidate_when_basename_is_polluted():
    video = parse("/downloads/abf-357ch/4k2.meabf-357ch.mp4")

    assert video is not None
    assert video.num == "ABF-357"
    assert video.is_zh is True


@pytest.mark.parametrize(
    ('path', 'expected_num', 'expected_zh', 'expected_uncensored'),
    [
        ('/videos/midv-639ch.mp4', 'MIDV-639', True, False),
        ('/videos/WSA-001-UC.mp4', 'WSA-001', True, True),
        ('/downloads/SONE-157-UC/SONE-157-UC.mp4', 'SONE-157', True, True),
        ('/downloads/MIDV- 653- UC/MIDV- 653- UC.mp4', 'MIDV-653', True, True),
        ('/downloads/abf-357ch/4k2.meabf-357ch.mp4', 'ABF-357', True, False),
        ('/ss/therealworkout.24.02.02.octavia.red.work.those.curves.mp4', 'THEREALWORKOUT.24.02.02', False, False),
        ('/ss/BangBros18.19.09.17.abcd.mp4', 'BANGBROS18.19.09.17', False, False),
        ('/ss/carib-020924-001-FHD.mp4', '020924-001', False, False),
        ('/ss/@江南@jn998.vip-020624_001-1pon-1080p.mp4', '020624-001', False, False),
        ('/ss/paco-012024_973-1080p.mp4', '012024-973', False, False),
        ('/ss/aavv39.xyz@020924-001-carib.mp4', '020924-001', False, False),
        ('/ss/mkbd-s120.mp4', 'MKBD-S120', False, False),
        ('/ss/CAWD-621-C.mp4', 'CAWD-621', True, False),
        ('/ss/www.freedl.org@200GANA-1921.mp4', '200GANA-1921', False, False),
    ],
)
def test_parse_supported_paths(path: str, expected_num: str, expected_zh: bool, expected_uncensored: bool):
    video = parse(path)

    assert video is not None
    assert video.num == expected_num
    assert video.is_zh is expected_zh
    assert video.is_uncensored is expected_uncensored


def test_detect_flags_prefers_tag_match_over_filename_guess():
    zh_result, uncensored_result = detect_flags_with_tag_priority(
        texts=[('download_name', 'IPX-001-UC')],
        tags=['字幕'],
    )

    assert zh_result.value is True
    assert uncensored_result.value is True


def test_detect_flags_falls_back_to_filename_when_tag_has_no_signal():
    zh_result, uncensored_result = detect_flags_with_tag_priority(
        texts=[('download_name', 'IPX-001-UC')],
        tags=['高清'],
    )

    assert zh_result.value is True
    assert uncensored_result.value is True


def test_detect_flags_applies_tag_priority_per_field():
    zh_result, uncensored_result = detect_flags_with_tag_priority(
        texts=[('download_name', 'IPX-001-U')],
        tags=['字幕'],
    )

    assert zh_result.value is True
    assert uncensored_result.value is True
