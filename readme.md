
# TouHou Music Web 播放器

## 介绍

TouHou Music Web 播放器是一个用于从 Subsonic 服务器流式传输和浏览音乐的 Web 应用程序。该应用程序提供了搜索专辑、艺术家和歌曲、查看专辑详情以及在浏览器中直接播放音乐的功能。

## 功能

- **浏览专辑**：查看 Subsonic 服务器上的最新专辑。
- **搜索**：搜索专辑、艺术家和歌曲。
- **查看专辑详情**：查看每张专辑的详细信息。
- **播放音乐**：直接从 Subsonic 服务器流式传输音乐。
- **封面缓存**：缓存封面图像以减少加载时间。
- **导航**：使用浏览器历史记录在页面之间导航。

## 前提条件

- Python 3.x
- Flask
- Requests 库
- Subsonic 服务器

## 安装

1. **克隆项目**

   ```bash
   git clone https://github.com/yourusername/touhou-music-web-player.git
   cd touhou-music-web-player
   ```

2. **创建虚拟环境并激活**

   ```bash
   python -m venv venv
   source venv/bin/activate  # 对于 Windows 用户，使用 `venv\Scriptsctivate`
   ```

3. **安装依赖**

   ```bash
   pip install -r requirements.txt
   ```

## 配置

在项目根目录下创建 `.env` 文件，并添加以下环境变量：

```plaintext
SUBSONIC_USERNAME=你的用户名
SUBSONIC_PASSWORD=你的密码
SECRET_KEY=你的密钥
FLASK_DEBUG=True  # 或者 False
```

## 运行

```bash
flask run
```

应用程序将在 `http://0.0.0.0:5000` 上运行。

## 目录结构

```
.
├── app.py               # 主应用程序文件
├── templates
│   └── index.html       # 主模板文件
├── static
│   ├── css
│   ├── js
│   └── img
├── requirements.txt     # 依赖文件
├── .env                 # 环境变量文件
└── README.md            # 说明文件
```

## API 端点

- **`/`**: 主页
- **`/get_albums/<page>`**: 获取专辑列表
- **`/get_album_details/<album_id>`**: 获取专辑详情
- **`/cover/<cover_art_id>`**: 获取封面图片
- **`/play/<song_id>`**: 播放歌曲
- **`/search`**: 搜索
- **`/search_artists`**: 搜索艺术家
- **`/search_songs`**: 搜索歌曲

## 许可证

此项目在 MIT 许可证下许可。
