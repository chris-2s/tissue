def cut(image):
    width, height = image.size
    width_new = int(width / 800 * 379)
    box = (width - width_new, 0, width, height)
    return image.crop(box)
