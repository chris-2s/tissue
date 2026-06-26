from collections.abc import Callable


UpgradeFunc = Callable[[dict], dict]

# Settings migration rules:
# 1. 首次从 ini 导入，或空库创建默认配置时，一律先写入各 namespace 的 v1 payload。
# 2. bootstrap() 随后根据 LATEST_VERSIONS 和 MIGRATIONS 逐步升级到最新版本。
# 3. 每个迁移函数只负责一步，例如 v1 -> v2，不要跨版本直接改到 v3。
# 4. 保存新配置时，总是按 latest_version(namespace) 写入。
#
# 下面是一个注释示例，说明将来如何给某个 namespace 增加 v2：
#
# def upgrade_library_v1_to_v2(payload: dict) -> dict:
#     # 输入 payload 是 library v1 结构
#     data = dict(payload)
#     # 例子：把逗号分隔字符串升级成数组字段
#     video_format = data.pop('video_format', '.mp4,.mkv,.mov')
#     data['video_formats'] = [item.strip() for item in video_format.split(',') if item.strip()]
#     # 例子：重命名字段
#     data['min_video_size_mb'] = data.pop('video_size_minimum', 100)
#     return data
#
# 然后做两件事：
# 1. 在对应 schema 中把 library 最新结构改成 v2。
# 2. 在本文件中注册：
#    LATEST_VERSIONS['library'] = 2
#    MIGRATIONS['library'][1] = upgrade_library_v1_to_v2

NAMESPACE_ORDER = (
    'library',
    'file',
    'download',
    'crawler',
    'notify',
    'cookiecloud',
)

LATEST_VERSIONS: dict[str, int] = {
    namespace: 1 for namespace in NAMESPACE_ORDER
}

MIGRATIONS: dict[str, dict[int, UpgradeFunc]] = {
    namespace: {} for namespace in NAMESPACE_ORDER
}


def latest_version(namespace: str) -> int:
    return LATEST_VERSIONS[namespace]


def get_upgrade(namespace: str, version: int) -> UpgradeFunc | None:
    return MIGRATIONS.get(namespace, {}).get(version)
