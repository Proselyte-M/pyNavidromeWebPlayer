from flask import Flask, render_template, jsonify, request, send_from_directory, Response, abort, make_response
import requests
import hashlib
import hmac
import time
import os
import json
import logging
from datetime import datetime, timedelta, timezone
import logging.config
from dotenv import load_dotenv
from thwiki_scraper import THWikiAlbumScraper
from flask_cors import CORS 


app = Flask(__name__, static_url_path='/static')
cors = CORS(app)


load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY','ppp')
SUBSONIC_API_URL = os.getenv('SUBSONIC_API_URL','http://0.0.0.0/rest')
API_VERSION = '1.16.1'
CLIENT_NAME = os.getenv('CLIENT_NAME','pywebplayer')
USERNAME = os.getenv('SUBSONIC_USERNAME', 'test')  # 使用环境变量存储用户名
PASSWORD = os.getenv('SUBSONIC_PASSWORD', 'test')  # 使用环境变量存储密码
FLASKDEBUG = os.getenv('SUBSONIC_PASSWORD', 'False')
INDEXJSON_FILE_PATH = 'indexes.json'
CACHE_DURATION = 86400  # 缓存持续时间，以秒为单位，这里设为1小时
CACHE_DIR = 'cover_cache'
logging.config.fileConfig('logging.ini')

def replace_slashes(obj):
    """
    替换字符串中的斜杠为全角斜杠，支持字符串、列表和字典类型的递归替换。

    Args:
        obj (str, list, dict): 需要替换斜杠的对象，可以是字符串、列表或字典。

    Returns:
        str, list, dict: 替换斜杠后的对象，类型与输入对象相同。
    """
    if isinstance(obj, str):
        return obj.replace('/', '／')  # 替换斜杠为全角斜杠
    elif isinstance(obj, list):
        return [replace_slashes(item) for item in obj]  # 递归替换列表中的元素
    elif isinstance(obj, dict):
        return {key: replace_slashes(value) for key, value in obj.items()}  # 递归替换字典中的值
    return obj  # 其他类型直接返回

def process_json(json_str):
    """
    处理包含斜杠替换的 JSON 字符串。

    Args:
        json_str (str): 需要处理的 JSON 字符串。

    Returns:
        str: 替换斜杠后的格式化 JSON 字符串。
    """
    obj = json.loads(json_str)  # 解析 JSON 字符串为 Python 对象
    new_obj = replace_slashes(obj)  # 替换对象中的斜杠
    new_json_str = json.dumps(new_obj, ensure_ascii=False, indent=4)  # 将替换后的对象转换为格式化 JSON 字符串
    return new_json_str  # 返回格式化的 JSON 字符串


def generate_encrypted_param(song_id):
    """
    生成加密参数用于播放特定歌曲。

    Args:
        song_id (str or int): 歌曲的唯一标识符。

    Returns:
        str: 包含时间戳和签名的加密参数。
    """
    timestamp = int(time.time())  # 获取当前时间戳
    payload = f'{song_id}{timestamp}'  # 构建用于签名的数据
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()  # 使用 HMAC 算法生成签名
    app.logger.debug(f"创建播放密钥: {timestamp}:{signature}")  # 记录调试信息
    return f'{timestamp}:{signature}'  # 返回带有时间戳和签名的加密参数

def verify_encrypted_param(song_id, encrypted_param):
    """
    验证加密参数是否有效用于播放特定歌曲。

    Args:
        song_id (str or int): 歌曲的唯一标识符。
        encrypted_param (str): 包含时间戳和签名的加密参数，格式为 'timestamp:signature'。

    Returns:
        bool: 如果加密参数有效则返回 True，否则返回 False。
    """
    app.logger.debug(f"尝试认证密钥: {song_id}:{encrypted_param}")
    
    try:
        timestamp, signature = encrypted_param.split(':')  # 拆分加密参数获取时间戳和签名
        timestamp = int(timestamp)  # 将时间戳转换为整数
    except ValueError:
        app.logger.debug(f"认证密钥失败: {song_id}:{encrypted_param}")
        return False

    current_time = int(time.time())  # 获取当前时间戳
    if current_time - timestamp > 21600:  # 如果当前时间与加密参数中的时间戳相差超过6小时
        return False

    payload = f'{song_id}{timestamp}'  # 构建用于签名的数据
    expected_signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()  # 使用 HMAC 算法生成预期签名
    app.logger.debug(f"认证密钥成功: {expected_signature}:{signature}")
    
    # 使用安全的方式比较签名
    return hmac.compare_digest(expected_signature, signature)



import os
import hashlib

def generate_token(password):
    """
    生成 Subsonic API 的认证 token。

    Args:
        password (str): 用户的密码。

    Returns:
        tuple: 包含 token 和 salt 的元组。
    """
    salt = os.urandom(16).hex()  # 使用随机生成的 salt
    token = hashlib.md5((password + salt).encode('utf-8')).hexdigest()  # 使用 MD5 算法生成 token
    app.logger.debug(f"生成Subsonic token: {token}:{salt}")  # 记录调试信息
    return token, salt  # 返回 token 和 salt 的元组


import os
import requests

def cache_cover_art(cover_art_id, token, salt, size, filetype):
    """
    缓存封面图片并返回文件路径。

    Args:
        cover_art_id (str): 封面图片的唯一标识符。
        token (str): Subsonic API 的认证 token。
        salt (str): 用于生成 token 的 salt。
        size (str): 图片的尺寸。
        filetype (str): 图片的文件类型。

    Returns:
        str or None: 缓存后的封面图片文件路径，如果获取失败则返回 None。
    """
    # 使用 cover_art_id 的 "-" 后面的部分作为真正的 ID
    if '-' in cover_art_id:
        cover_file_name = cover_art_id.split('-')[-1]
    
    app.logger.debug(f"开始缓存图片: {cover_art_id}:{filetype}")
    
    subdir = cover_file_name[:2]
    cover_dir = os.path.join(CACHE_DIR, size, subdir)
    cover_path = os.path.join(cover_dir, f'{cover_art_id}.{filetype}')  # 修改文件后缀为 .webp

    # 检查缓存目录是否存在，不存在则创建
    if not os.path.exists(cover_dir):
        app.logger.debug(f"图片缓存文件夹不存在，尝试创建: {cover_dir}")
        os.makedirs(cover_dir)

    # 如果封面图片文件不存在，则从 API 获取并保存
    if not os.path.exists(cover_path):
        app.logger.debug(f"未找到缓存的图片，尝试从 API 获取: {cover_path}")
        try:
            response = requests.get(f'{SUBSONIC_API_URL}/getCoverArt.view', params={
                'u': USERNAME,
                't': token,
                's': salt,
                'v': API_VERSION,
                'c': CLIENT_NAME,
                'id': cover_art_id,
                'size': size,
                'f': filetype  # 指定获取的图片格式为 WebP
            })
            app.logger.debug(f"API 请求地址: {response.url}")
            response.raise_for_status()
            with open(cover_path, 'wb') as f:
                app.logger.debug(f"成功获取图片，保存到: {cover_path}")
                f.write(response.content)

        except requests.RequestException as e:
            app.logger.error(f"获取封面图片失败: {e}")
            return None

    app.logger.debug(f"返回图片路径: {cover_path}")
    return cover_path


def process_value(input_value):
    """
    处理输入值并返回处理后的结果。

    Args:
        input_value (str or float): 输入的值，可以是字符串或浮点数。

    Returns:
        int: 处理后的整数结果，根据输入值不同的范围进行不同的处理：
             - 如果无法转换为浮点数，则返回 300。
             - 根据输入值的大小返回不同的处理结果，保证返回的结果符合特定的范围。
    """
    try:
        value = float(input_value)  # 尝试将输入转换为浮点数
    except ValueError:
        return 300  # 如果无法转换为浮点数，则返回 300

    # 根据不同的范围进行处理并返回结果
    if value < 50:
        return 50
    elif value < 100:
        return round(value / 10) * 10
    elif value < 300:
        return round(value / 50) * 50
    elif value < 1000:
        return round(value / 100) * 100
    elif value < 2000:
        return round(value / 200) * 200
    elif value < 3000:
        return round(value / 500) * 500
    else:
        return 3000

    
def filter_json(data, fields_to_keep):
    """
    过滤 JSON 数据，仅保留指定的字段。

    :param data: 原始 JSON 数据
    :param fields_to_keep: 要保留的字段列表
    :return: 过滤后的 JSON 数据
    """
    if isinstance(data, dict):
        return {key: filter_json(value, fields_to_keep) for key, value in data.items() if key in fields_to_keep}
    elif isinstance(data, list):
        return [filter_json(item, fields_to_keep) for item in data]
    else:
        return data
    

@app.route('/newcover/<size>/<cover_art_id>')
def newcover(size,cover_art_id):
    print(size,cover_art_id)
    size = str(process_value(size))
    token, salt = generate_token(PASSWORD)
    cover_path = cache_cover_art(cover_art_id, token, salt,size,'webp')
    app.logger.debug(f"客户端尝试获取图片: {cover_art_id}")
    if cover_path and os.path.exists(cover_path):
        response = send_from_directory(os.path.dirname(cover_path), os.path.basename(cover_path))
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        response.headers['Expires'] = (datetime.now(timezone.utc) + timedelta(days=365)).strftime("%a, %d %b %Y %H:%M:%S GMT")
        response.headers['Content-Type'] = 'image/webp'  # 设置正确的 Content-Type
        app.logger.debug(f"向客户端返回图片: {cover_path}")
        return response
    else:
        app.logger.debug(f"客户端获取图片失败: {cover_art_id}")
        return jsonify({'status': 'error', 'message': 'Cover art not found'}), 404
    
@app.route('/popup-content')
def popup():
    return render_template('popup.html')

@app.route('/')
def index():
    app.logger.debug(f"客户端尝试获取主页: {request.remote_addr}")
    return render_template('index.html')

@app.route('/get_albums/<page>')
def get_albums(page):
    size = 20
    token, salt = generate_token(PASSWORD)
    number = int(page)
    result = number * size
    page = str(result)
    app.logger.debug(f"客户端尝试获取专辑列表: {page}")
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getAlbumList.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'type': 'newest',
            'size': size,
            'offset': page
        })
        app.logger.debug(f"api访问地址: {response.url}")
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            albums = response.json()['subsonic-response'].get('albumList', {}).get('album', [])
            fields_to_keep = {"index", "artist", "album", "name","coverArt","year","id"}
            albums = filter_json(albums, fields_to_keep)
            return jsonify({'status': 'ok', 'albums': albums})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            app.logger.error(f"客户端获取专辑列表失败: {page}")
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        app.logger.error(f"Failed to get albums: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get albums'})

@app.route('/get_album_details/<album_id>')
def get_album_details(album_id):
    token, salt = generate_token(PASSWORD)
    app.logger.debug(f"客户端尝试获取专辑详情: {album_id}")
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getAlbum.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'id': album_id
        })
        app.logger.debug(f"api访问地址: {response.url}")
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            album = response.json()['subsonic-response'].get('album', {})
            fields_to_keep = {"index", "artist", "album", "name","coverArt","year","id","song","title","track","artistId","duration","songCount"}
            album = filter_json(album, fields_to_keep)
            album = replace_slashes(album)
            return jsonify({'status': 'ok', 'album': album})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        app.logger.error(f"Failed to get album details: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get album details'})

@app.route('/albums/<album_id>')
def albums(album_id):
    app.logger.debug(f"客户端尝试通过url访问专辑详情: {album_id}")
    return render_template('index.html', album_id=album_id)

@app.route('/displayFavoriteAlbums')
def displayFavoriteAlbums():
    app.logger.debug(f"客户端尝试通过url访问收藏的专辑")
    return render_template('index.html')

@app.route('/artist/<artist_id>')
def artist(artist_id):
    app.logger.debug(f"客户端尝试通过url访问艺术家详情: {artist_id}")
    return render_template('index.html', artist_id=artist_id)

@app.route('/albumlist/<page>')
def albumlist(page):
    app.logger.debug(f"客户端尝试通过url访问专辑列表: {page}")
    return render_template('index.html', page=page)

@app.route('/search/<query>')
def searchAlbums(query):
    app.logger.debug(f"客户端尝试通过url访问搜索: {query}")
    return render_template('index.html', query=query)

@app.route('/getArtist/<artist_id>')
def getArtist(artist_id):
    token, salt = generate_token(PASSWORD)
    app.logger.debug(f"客户端尝试访问艺术家详情: {artist_id}")
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getArtist.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'id': artist_id
        })
        app.logger.debug(f"api访问地址: {response.url}")
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            artist = response.json()['subsonic-response'].get('artist', {})
            fields_to_keep = {"index", "artist", "album", "name","coverArt","year","id"}
            artist = filter_json(artist, fields_to_keep)
            return jsonify({'status': 'ok', 'artist': artist})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        app.logger.error(f"Failed to get artist details: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get artist details'})
    
@app.route('/getIndexes')
def getIndexes():
    app.logger.debug(f"客户端尝试访问艺术家列表")
    def is_file_from_today(file_path):
        if os.path.exists(file_path):
            file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
            app.logger.debug(f"检查本地是否存在艺术家列表json，返回本地文件日期: {file_time}")
            return file_time.date() == datetime.now().date()
        return False

    if is_file_from_today(INDEXJSON_FILE_PATH):
        with open(INDEXJSON_FILE_PATH, 'r') as file:
            indexes = json.load(file)
            response = make_response(jsonify({'status': 'ok', 'indexes': indexes}))
            response.headers['Cache-Control'] = f'public, max-age={CACHE_DURATION}'
            app.logger.debug(f"本地存在艺术家列表json，返回本地文件")
            return response

    token, salt = generate_token(PASSWORD)
    app.logger.debug(f"本地不存在艺术家列表json，通过api获取")
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getIndexes.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json'
        })
        app.logger.debug(f"api访问地址: {response.url}")
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            indexes = response.json()['subsonic-response'].get('indexes', {})
            fields_to_keep = {"index", "artist", "album", "name","id"}
            indexes = filter_json(indexes, fields_to_keep)
            with open(INDEXJSON_FILE_PATH, 'w') as file:
                app.logger.debug(f"获取到艺术家列表，保存为本地文件：{INDEXJSON_FILE_PATH}")
                json.dump(indexes, file)
            response = make_response(jsonify({'status': 'ok', 'indexes': indexes}))
            response.headers['Cache-Control'] = f'public, max-age={CACHE_DURATION}'
            return response
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        app.logger.error(f"Failed to get indexes: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get indexes'})
    
@app.route('/play/<song_id>')
def play_song(song_id):
    app.logger.debug(f"客户端尝试播放音乐：{song_id}")
    encrypted_param = request.args.get('token')
    if not encrypted_param or not verify_encrypted_param(song_id, encrypted_param):
        app.logger.debug(f"音乐url超期：{song_id}")
        abort(403)  # Forbidden
    token, salt = generate_token(PASSWORD)
    stream_url = f'{SUBSONIC_API_URL}/stream.view?u={USERNAME}&t={token}&s={salt}&v={API_VERSION}&c={CLIENT_NAME}&id={song_id}'
    app.logger.debug(f"api访问地址: {stream_url}")   
    try:
        r = requests.get(stream_url, stream=True)
        r.raise_for_status()
        content_length = r.headers.get('Content-Length')
        app.logger.debug(f"内容长度: {content_length}")
        def generate():
            for chunk in r.iter_content(chunk_size=1024):
                if chunk:
                    yield chunk
        # 设置动态的文件名为 song_id
        filename = f"{song_id}.m4a"
        response = Response(generate(), content_type='audio/mp4', headers={
            'Content-Disposition': f'inline; filename="{filename}"',
            'Cache-Control': 'public, max-age=31536000',
            'Accept-Ranges': 'bytes'
        })
        if content_length:
            response.headers['Content-Length'] = content_length
        return response
    except requests.RequestException as e:
        app.logger.error(f"Failed to stream song: {e}")
        abort(500)  # Internal Server Error

@app.route('/generate_token/<song_id>')
def generate_token_endpoint(song_id):
    
    token = generate_encrypted_param(song_id)
    app.logger.debug(f"生成音乐播放token：{song_id}，{token}")
    return jsonify({'token': token})

@app.route('/search')
def search():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)
    app.logger.debug(f"客户端尝试搜索专辑{query}")
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/search2.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'query': query,
            'albumCount': 50
        })
        app.logger.debug(f"api访问地址: {response.url}")
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            albums = response.json()['subsonic-response'].get('searchResult2', {}).get('album', [])
            fields_to_keep = {"index", "artist", "album", "name","coverArt","year","id"}
            albums = filter_json(albums, fields_to_keep)
            return jsonify({'status': 'ok', 'albums': albums})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        app.logger.error(f"Failed to search albums: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to search albums'})

@app.route('/search_artists')
def search_artists():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)
    app.logger.debug(f"客户端尝试搜索艺术家{query}")
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/search2.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'query': query,
            'artistCount': 100
        })
        app.logger.debug(f"api访问地址: {response.url}")
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            artists = response.json()['subsonic-response'].get('searchResult2', {}).get('artist', [])
            fields_to_keep = {"artist","name","id"}
            artists = filter_json(artists, fields_to_keep)
            return jsonify({'status': 'ok', 'artists': artists})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        app.logger.error(f"Failed to search artists: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to search artists'})

@app.route('/search_songs')
def search_songs():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)
    app.logger.debug(f"客户端尝试搜索歌曲{query}")
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/search2.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'query': query,
            'songCount': 100
        })
        app.logger.debug(f"api访问地址: {response.url}")
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            songs = response.json()['subsonic-response'].get('searchResult2', {}).get('song', [])
            fields_to_keep = {"artist", "album","coverArt","id","song","title","track","artistId","albumId"}
            songs = filter_json(songs, fields_to_keep)
            return jsonify({'status': 'ok', 'songs': songs})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        app.logger.error(f"Failed to search songs: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to search songs'})

@app.route('/getGenres')
def getGenres():
    token, salt = generate_token(PASSWORD)
    app.logger.debug(f"客户端尝试获取音乐风格")
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getGenres.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
        })
        app.logger.debug(f"api访问地址: {response.url}")
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            genres = response.json()['subsonic-response'].get('genres', {})
            return jsonify({'status': 'ok', 'genres': genres})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        app.logger.error(f"Failed to get genres: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get genres'})

@app.route('/getSongsByGenre/<Genre>/<offset>')
def getSongsByGenre(Genre,offset):
    number = int(offset)
    result = number * 500
    page = str(result)
    token, salt = generate_token(PASSWORD)
    app.logger.debug(f"客户端尝试获取风格详情: {Genre},{offset}")
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getSongsByGenre.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'count':'500',
            'genre': Genre,
            'offset': page
        })
        app.logger.debug(f"api访问地址: {response.url}")
        response.raise_for_status()
        # 检查响应中是否包含有效数据
        if 'subsonic-response' in response.json() and response.json()['subsonic-response']['status'] == 'ok':
            subsonic_response = response.json()['subsonic-response']           
            # 使用 get() 方法安全获取 songsByGenre 中的 song 列表，如果不存在则返回空列表
            GenreList = subsonic_response.get('songsByGenre', {}).get('song', [])          
            albums = {}
            # 遍历每首歌曲
            for song in GenreList:
                album_name = song.get("album")
                if album_name:
                    if album_name not in albums:
                        # 初始化专辑信息
                        albums[album_name] = {
                            "album": album_name,
                            "artist": song.get("artist"),
                            "year": song.get("year"),
                            "genre": song.get("genre"),
                            "albumId": song.get("albumId"),
                            "artistId": song.get("artistId"),
                            "coverArt": song.get("coverArt"),
                    #        "songs": []
                        }
                    # 将歌曲信息添加到专辑中
                    #albums[album_name]["songs"].append({
                    #    "id": song.get("id"),
                    #    "title": song.get("title"),
                    #    "artist": song.get("artist"),
                    #    "year": song.get("year"),
                    #    "genre": song.get("genre")
                    #})
            
            return jsonify({'status': 'ok', 'GenreList': list(albums.values())})       
        else:
            error_message = response.json().get('subsonic-response', {}).get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})   
    except requests.RequestException as e:
        app.logger.error(f"Failed to get getSongsByGenre details: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get getSongsByGenre details'})


#################SEO########################
@app.route('/sitemap.xml')
def sitemap():
    # 返回静态文件中的sitemap.xml
    return send_from_directory('static', 'sitemap.xml')

@app.route('/sitemap_index.xml')
def sitemap_index():
    # 返回静态文件中的sitemap.xml
    return send_from_directory('static', 'sitemap.xml')
    
@app.route('/sitemap_with_schema.html')
def sitemap_with_schema():
    # 返回静态文件中的sitemap.xml
    return send_from_directory('static', 'sitemap_with_schema.html')

@app.route('/robots.txt')
def robots():
    # 返回静态文件中的sitemap.xml
    return send_from_directory('static', 'robots.txt')



######thwiki######
scraper = THWikiAlbumScraper()  # 创建一个THWikiAlbumScraper实例

@app.route('/getWikiAlbumInfo/<artist_name>/<album_name>')
def getWikiAlbumInfo(artist_name,album_name):
    app.logger.debug(f"尝试从thwiki获取: {artist_name}-{album_name}")
    album_id = scraper.get_album_info(artist_name,album_name)
    if (album_id == ""):
        return ""
    album_id = album_id[0]
    app.logger.debug(f"专辑ID为: {album_id}")
    if (album_id==''):
        return r"{}"
    album_info = scraper.get_album_detail(album_id)
    return jsonify({"album_info": album_info})

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True)



