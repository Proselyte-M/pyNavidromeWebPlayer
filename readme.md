# 简单的subsonic免登播放站

音乐播放播放器使用了[Aplayer](https://github.com/DIYgod/APlayer)，感谢。

## 部署方法
### 1、下载至本地。
### 2、修改代码中的以下部分
```
SECRET_KEY = 'ppp' #用于加密流媒体url的密钥，用于防止超期播放
SUBSONIC_API_URL = 'http://10.39.160.20:4533/rest' #你自己的subsonic服务器端API地址
API_VERSION = '1.16.1' #目前只用于这个版本的服务器端
CLIENT_NAME = 'pywebplayer' #用于在你的subsonic服务器上显示客户端名称
USERNAME = os.getenv('SUBSONIC_USERNAME', 'test')  # 你的subsonic服务器端用户名
PASSWORD = os.getenv('SUBSONIC_PASSWORD', 'test')  # 你的subsonic服务器端密码
FLASKDEBUG = os.getenv('SUBSONIC_PASSWORD', 'False') 
INDEXJSON_FILE_PATH = 'indexes.json' #当音乐库非常大时，读取艺术家列表太慢，就在本地缓存一份，每日更新
CACHE_DURATION = 86400  # 缓存持续时间，以秒为单位，这里设为1小时
CACHE_DIR = 'cover_cache' #用于缓存图片的目录
```
### 3、运行start.cmd

[DEMO地址](https://player.thmusic.top/)