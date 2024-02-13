def cut(image):
    shape = image.shape
    width_new = int(shape[1] / 800 * 379)
    poster = image[0:shape[0], shape[1] - width_new:shape[1]]
    return poster
