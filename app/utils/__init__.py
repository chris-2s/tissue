import os


def convert_size(text, bits=2):
    units = ["B", "KB", "MB", "GB", "TB", "PB"]
    size = 1024
    for i in range(len(units)):
        if (text / size) < 1:
            return f"%.{bits}f%s" % (text, units[i])
        text = text / size


def remove_empty_directory(path: str):
    parent = os.path.abspath(os.path.join(path, '..'))
    if os.path.isdir(path):
        ds_store = os.path.join(path, '.DS_Store')
        if os.path.exists(ds_store):
            os.remove(ds_store)

        children = os.listdir(path)
        if children:
            return
        else:
            os.rmdir(path)
            remove_empty_directory(parent)
    else:
        remove_empty_directory(parent)
