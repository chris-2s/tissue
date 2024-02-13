import os


def convert_size(text):
    units = ["B", "KB", "MB", "GB", "TB", "PB"]
    size = 1024
    for i in range(len(units)):
        if (text / size) < 1:
            return "%.2f%s" % (text, units[i])
        text = text / size


def remove_empty_directory(path: str):
    parent = os.path.abspath(os.path.join(path, '..'))
    if os.path.isdir(path):
        children = os.listdir(path)
        if children:
            return
        else:
            os.rmdir(path)
            remove_empty_directory(parent)
    else:
        remove_empty_directory(parent)
