from urllib.parse import urljoin, urlparse, quote


def fix_m3u8_paths(m3u8_content: str, video_url: str) -> str:
    """
    修复 m3u8 内容中的相对路径
    将片段路径替换为后端代理路径 /api/common/trailer?url={片段URL}
    """
    parsed = urlparse(video_url)
    base_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rsplit('/', 1)[0]}/"

    lines = m3u8_content.splitlines()
    fixed_lines = []

    for line in lines:
        if line and not line.startswith('#'):
            if not line.startswith('http'):
                line = urljoin(base_url, line)
            line = f"/common/trailer?url={quote(line)}"
        fixed_lines.append(line)

    return '\n'.join(fixed_lines)


def is_m3u8(url: str, content_type: str = None) -> bool:
    """判断是否为 m3u8 内容"""
    if url.endswith('.m3u8'):
        return True
    if content_type and 'mpegurl' in content_type.lower():
        return True
    return False
