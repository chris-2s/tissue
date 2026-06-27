from app.utils.m3u8 import fix_m3u8_paths


def test_fix_m3u8_paths_rewrites_segments_and_key_uri():
    content = """#EXTM3U
#EXT-X-KEY:METHOD=AES-128,URI="https://cdn.example.com/video/encryption.key"
#EXT-X-MAP:URI="init.mp4"
#EXTINF:10.0,
seg-1.ts
#EXTINF:10.0,
https://cdn.example.com/video/seg-2.ts?sign=abc
"""
    result = fix_m3u8_paths(
        content,
        "https://cdn.example.com/video/playlist.m3u8",
        "http://127.0.0.1:8000",
    )

    assert 'URI="http://127.0.0.1:8000/common/trailer?url=https%3A%2F%2Fcdn.example.com%2Fvideo%2Fencryption.key&base_url=http%3A%2F%2F127.0.0.1%3A8000"' in result
    assert 'URI="http://127.0.0.1:8000/common/trailer?url=https%3A%2F%2Fcdn.example.com%2Fvideo%2Finit.mp4&base_url=http%3A%2F%2F127.0.0.1%3A8000"' in result
    assert 'http://127.0.0.1:8000/common/trailer?url=https%3A%2F%2Fcdn.example.com%2Fvideo%2Fseg-1.ts&base_url=http%3A%2F%2F127.0.0.1%3A8000' in result
    assert 'http://127.0.0.1:8000/common/trailer?url=https%3A%2F%2Fcdn.example.com%2Fvideo%2Fseg-2.ts%3Fsign%3Dabc&base_url=http%3A%2F%2F127.0.0.1%3A8000' in result
