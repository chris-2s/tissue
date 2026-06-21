from app.utils.num_parser import parse, parse_extra, parse_num


def test_parse_num_supports_standard_dash_pattern():
    assert parse_num("CAWD-621") == "CAWD-621"


def test_parse_num_supports_c_suffix():
    assert parse_num("CAWD-621-C") == "CAWD-621"


def test_parse_num_supports_fhd_pattern():
    assert parse_num("carib-020924-001-FHD") == "020924-001"


def test_parse_extra_detects_zh_and_uncensored_flags():
    assert parse_extra("MIDV-639-UC") == (True, True)


def test_parse_returns_video_detail_from_path():
    video = parse("/videos/midv-639ch.mp4")

    assert video is not None
    assert video.num == "MIDV-639"
    assert video.is_zh is True
    assert video.is_uncensored is False


def test_parse_returns_none_when_number_cannot_be_identified():
    assert parse("/videos/examplefile.mp4") is None
