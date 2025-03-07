# Tissue

![GitHub License](https://img.shields.io/github/license/chris-2s/tissue)
![Docker Image Version](https://img.shields.io/docker/v/chris2s/tissue/latest)
![Docker Image Size](https://img.shields.io/docker/image-size/chris2s/tissue/latest)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/chris-2s/tissue/build.yml)

老师教材刮削工具，提供海报下载、元数据匹配等功能，使教材能够在Jellyfin、Emby、Kodi等工具里装订成册，便于学习。

[效果图传送阵](#talk-is-cheap-show-me-the-view)

### 注意事项

- ***科学的上网方式***是使用本项目的前提，这是最重要的一点。
- 项目仍处于非常早期阶段，只是满足了最基本的需求。
- 目前仍有许多bug，不排除有丢失或污染数据的可能性，请做好备份，酌情使用。
- 对于非Tissue刮削的NFO文件打开可能存在报错，有处理了部分情况，可能还有遗漏的情况。
- 当前还是自用为主，请勿在国内任何平台讨论本项目。

### 部署方式

目前仅提供Docker一种部署方式

[前往Docker Hub下载](https://hub.docker.com/r/chris2s/tissue)

或直接执行以下命令，请将路径或端口按照自己的实际情况做调整，相关说明请往下看

```shell
docker run \
  -d \
  --name=tissue \
  -e TZ="Asia/Shanghai" \
  -p '9193:9193' \
  -v '/path/for/config':'/app/config' \
  -v '/path/for/video':'/data/video' \
  -v '/path/for/file':'/data/file' \
  -v '/path/for/downloads':'/downloads' \
  'chris2s/tissue:latest'
```

### Docker环境变量

| 变量    | 说明         | 是否必填 | 默认值 |
|-------|------------|------|-----|
| PUID  | 运行程序的用户ID  | 否    | 0   |
| PGID  | 运行程序的用户组ID | 否    | 0   |
| UMASK | 掩码权限       | 否    | 000 |

### 端口映射

目前就用到一个 ***9193*** 端口，虽然前后端分离，但是使用Nginx把/api反向代理给服务端了

### 路径映射

影片和文件在容器内的路径均可在设置页面修改，请根据自己实际情况调整。

| 路径   | 说明                                                                             | 容器内地址       |
|------|--------------------------------------------------------------------------------|-------------|
| 影片路径 | 会自动扫描该路径下的所有视频，即媒体库路径                                                          | /data/media |
| 文件路径 | 后续希望设计成监控路径，路径下有文件后会自动刮削并转移到媒体库。目前可作为本项目还不支持QB以外下载器替代方案，即将本地址映射到其他下载器的下载路径     | /data/file  |
| QB路径 | 目前本项目有且只支持qBittorrent，请将QB内的下载路径映射到容器中，如果QB的下载路径和系统路径不同名，请在设置页面设置下载路径在系统中的对应路径 | 无           |

### 默认用户

用户名：admin

默认密码：password

### 额外说明

文件和下载器的转移方式支持复制和移动两种。

使用移动的时候注意，由于Docker的机制，即使移动的两个目录在宿主机是同一个磁盘，但分两个路径挂载到Docker时，虽然使用移动，也会跨磁盘的效果，无法秒完成。

所以将两个路径的共同父级映射到容器中会是更好的做法。

### Talk is cheap, show me the view

<img width="1685" alt="image" src="https://github.com/chris-2s/tissue/assets/159798260/e5707b21-2737-4fb6-839e-a213318eddf3">
<img width="1685" alt="image" src="https://github.com/chris-2s/tissue/assets/159798260/4597df98-87bf-40a6-805f-37dc0b5e02ad">
<img width="1682" alt="image" src="https://github.com/chris-2s/tissue/assets/159798260/ac11e3c0-7631-40cb-bef6-7074fe3bbc2f">


