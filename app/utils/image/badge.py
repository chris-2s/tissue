from PIL import Image

REFERENCE_WIDTH = 379
REFERENCE_HEIGHT = 538
BADGE_HEIGHT = 35
BADGE_LEFT_PADDING = 5
BADGE_TOP_PADDING = 12
BADGE_GAP = 5


def tags(fan_art: Image, is_zh, is_uncensored):
    if not is_zh and not is_uncensored:
        return fan_art

    mode = fan_art.mode
    thumb = fan_art.convert('RGBA')

    index = 0
    if is_zh:
        tag = Image.open("./app/utils/image/ch.png").convert('RGBA')
        thumb = add_badges(thumb, tag, index)
        index += 1

    if is_uncensored:
        tag = Image.open("./app/utils/image/uncensored.png").convert('RGBA')
        thumb = add_badges(thumb, tag, index)
        index += 1

    if thumb.mode != mode:
        return thumb.convert(mode)
    else:
        return thumb


def add_badges(thumb: Image, tag, index):
    left, top, right, bottom = _badge_box(thumb.size, tag.size, index)
    badge_width = right - left
    badge_height = bottom - top

    resized_badge = tag.resize((badge_width, badge_height), Image.Resampling.LANCZOS)
    box = (left, top, right, bottom)
    thumb.paste(resized_badge, box, mask=resized_badge)

    return thumb


def _badge_box(image_size, tag_size, index):
    image_width, image_height = image_size
    tag_width, tag_height = tag_size
    scale = min(image_width / REFERENCE_WIDTH, image_height / REFERENCE_HEIGHT)

    badge_height = max(1, round(BADGE_HEIGHT * scale))
    badge_width = max(1, round(badge_height * tag_width / tag_height))
    left = max(1, round(BADGE_LEFT_PADDING * scale))
    top_padding = max(1, round(BADGE_TOP_PADDING * scale))
    gap = max(1, round(BADGE_GAP * scale))
    top = top_padding + (badge_height + gap) * index

    return left, top, left + badge_width, top + badge_height
