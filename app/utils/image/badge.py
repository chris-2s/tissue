from PIL import Image


def tags(fan_art: Image, is_zh, is_uncensored):
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
    thumb_width, thumb_height = thumb.size
    tag_width, tag_height = tag.size

    badge_height = int((35 / 538) * thumb_height)
    badge_width = int(badge_height * (tag_width / tag_height))

    resized_badge = tag.resize((badge_width, badge_height), Image.Resampling.LANCZOS)

    badge_step = int((5 / 538) * thumb_width)

    top = badge_step + (badge_step + badge_height) * index
    bottom = top + badge_height

    left = badge_step
    right = left + badge_width

    box = (left, top, right, bottom)
    thumb.paste(resized_badge, box, mask=resized_badge)

    return thumb
