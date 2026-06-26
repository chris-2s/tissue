# Settings Migration

## Current behavior

- `settings` 表按 `namespace` 一行一条配置记录存储。
- 每行有自己的 `version`。
- 当前所有 namespace 的最新版本都是 `v1`。
- 无论是：
  - 从 `config/app.conf` 导入旧配置
  - 还是空库初始化默认配置

  都会先生成 `v1` payload，再由 `bootstrap()` 按迁移链逐步升级到最新版本。
- 如果是从 `config/app.conf` 成功导入，并且整套迁移顺利完成：
  - `bootstrap()` 会删除旧的 `config/app.conf`

## Bootstrap order

启动顺序固定为：

1. `alembic upgrade head`
2. `settings_manager.bootstrap()`
3. 业务组件初始化

因此：

- Alembic 负责表结构，例如 `settings` 表。
- `bootstrap()` 负责 ini 导入、默认配置落库、payload 升级。
- 业务代码只应读取升级后的最新配置。

## How versioning works

以 `library` 为例：

- 空库或 ini 导入时，先写入 `library v1`
- 如果当前最新是 `library v3`
- `bootstrap()` 会依次执行：
  - `v1 -> v2`
  - `v2 -> v3`

也就是说，迁移永远是链式逐步执行，不跳步。

## Add a new version

假设要把 `library` 从 `v1` 升到 `v2`。

### Step 1: Update the latest schema

先修改当前使用的 schema，使它表示 `library` 的最新结构。

例如在 [app/schema/setting.py](/Users/chris/Documents/fastapi/tissue/app/schema/setting.py:1) 中更新 `SettingLibrary`。

### Step 2: Add a one-step upgrade function

在 [app/settings/migrations.py](/Users/chris/Documents/fastapi/tissue/app/settings/migrations.py:1) 中增加单步迁移函数：

```python
def upgrade_library_v1_to_v2(payload: dict) -> dict:
    data = dict(payload)

    video_format = data.pop('video_format', '.mp4,.mkv,.mov')
    data['video_formats'] = [item.strip() for item in video_format.split(',') if item.strip()]

    data['min_video_size_mb'] = data.pop('video_size_minimum', 100)
    return data
```

要求：

- 只处理一步：`v1 -> v2`
- 输入是旧版本 payload
- 输出是下一版本 payload
- 不要在迁移函数里直接访问数据库
- 不要跨版本一次改很多步

### Step 3: Register the migration

在同一个文件中注册：

```python
LATEST_VERSIONS['library'] = 2
MIGRATIONS['library'][1] = upgrade_library_v1_to_v2
```

其中：

- `LATEST_VERSIONS['library'] = 2` 表示当前最新版本是 `v2`
- `MIGRATIONS['library'][1]` 表示“从 v1 升到 v2 的函数”

### Step 4: Let bootstrap run

下次启动时：

- 已经是 `v2` 的记录不会变
- 还是 `v1` 的记录会自动执行 `upgrade_library_v1_to_v2`

## Important notes

- 不要修改旧版本的含义；旧版本一旦发布，就只通过迁移函数升级。
- 不要让 importer 直接生成最新结构；importer 只负责生成 `v1`。
- 新保存的配置应直接写入最新版本。
- 如果新增一个全新的 namespace，先给它定义 `v1` schema，再把它加入：
  - `NAMESPACE_ORDER`
  - `LATEST_VERSIONS`
  - `MIGRATIONS`

## When to bump version

不是每次新增字段都必须升级 version。

建议遵守下面这条判断标准：

- 如果旧 payload 不跑迁移，只靠 schema 默认值补齐，新旧数据的业务语义就已经完全正确：
  - 可以不升级 version
- 如果旧 payload 必须改写、回填、重命名、重组，或者仅靠默认值会掩盖真实语义：
  - 必须升级 version

### No version bump needed

这类情况可以只改 schema，不写迁移脚本：

- 新增一个有安全默认值的字段
- 旧记录缺这个字段时，schema 默认值已经足够正确
- 不要求数据库立刻持久化出这个新字段
- 这个字段不会影响后续迁移判断

例如：

```python
class SettingCrawler(BaseModel):
    timeout: int = 60
    request_interval_seconds: int = 2
```

如果旧记录没有 `request_interval_seconds`，但读取后默认补成 `2` 就能正确工作，那可以不升级 version。

### Version bump required

下面这些情况必须升级 version，并补对应迁移函数：

- 字段重命名
- 字段类型变化
- 平铺结构改成嵌套结构
- 需要根据旧字段推导新字段
- 需要给旧数据回填真实值，而不是用统一默认值
- 旧字段废弃，新字段接管语义
- 希望数据库中的 payload 立即统一成新结构

例如：

- `video_format: ".mp4,.mkv"` 改成 `video_formats: [".mp4", ".mkv"]`
- `video_size_minimum` 改成 `min_video_size_mb`
- `timeout` 改成 `http.timeout_seconds`

这类都要升级 version。

### Practical recommendation

即使某个新增字段“理论上可以只靠默认值”，如果它满足下面任一条件，也建议尽早升一次 version，把它写入 payload：

- 这是核心配置
- 后续大概率还会继续演进
- 后续迁移可能依赖这个字段是否存在
- 你希望数据库里的 payload 形态尽量统一

可以理解成：

- 小字段、纯默认值扩展：可以不升
- 核心字段、结构演进字段：建议升

## Current namespaces

- `library`
- `file`
- `download`
- `crawler`
- `notify`
- `cookiecloud`
