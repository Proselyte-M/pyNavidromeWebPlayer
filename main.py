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

app = Flask(__name__, static_url_path='/static')

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


def generate_encrypted_param(song_id):
    timestamp = int(time.time())
    payload = f'{song_id}{timestamp}'
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    app.logger.debug(f"创建播放密钥: {timestamp}:{signature}")
    return f'{timestamp}:{signature}'

def verify_encrypted_param(song_id, encrypted_param):
    app.logger.debug(f"尝试认证密钥: {song_id}:{encrypted_param}")
    try:
        timestamp, signature = encrypted_param.split(':')
        timestamp = int(timestamp)
    except ValueError:
        app.logger.debug(f"认证密钥失败: {song_id}:{encrypted_param}")
        return False

    current_time = int(time.time())
    if current_time - timestamp > 21600:  # 6h minutes
        return False

    payload = f'{song_id}{timestamp}'
    expected_signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    app.logger.debug(f"认证密钥成功: {expected_signature}:{signature}")
    return hmac.compare_digest(expected_signature, signature)


def generate_token(password):
    """生成Subsonic API的认证token."""
    salt = os.urandom(16).hex()  # 使用随机生成的salt
    token = hashlib.md5((password + salt).encode('utf-8')).hexdigest()
    app.logger.debug(f"生成Subsonic token: {token}:{salt}")
    return token, salt

def cache_cover_art(cover_art_id, token, salt, size, filetype):
    """缓存封面图片并返回文件路径."""
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

    if not os.path.exists(cover_path):
        app.logger.debug(f"没找到缓存图片，尝试从 API 获取: {cover_path}")
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
            app.logger.debug(f"api访问地址: {response.url}")
            response.raise_for_status()
            with open(cover_path, 'wb') as f:
                app.logger.debug(f"获取到图片，保存到: {cover_path}")
                f.write(response.content)

            # 如果需要转换为 WebP 格式，可以添加以下代码（需要安装 Pillow 库）
            # image = Image.open(cover_path)
            # image.save(cover_path, 'webp')

        except requests.RequestException as e:
            app.logger.error(f"获取封面图片失败: {e}")
            return None

    app.logger.debug(f"返回图片: {cover_path}")
    return cover_path


@app.route('/cover/<cover_art_id>')
def cover(cover_art_id):
    size = "300"
    token, salt = generate_token(PASSWORD)
    cover_path = cache_cover_art(cover_art_id, token, salt,size,'webp')
    app.logger.debug(f"客户端尝试获取图片: {cover_art_id}")
    if cover_path and os.path.exists(cover_path):
        response = send_from_directory(os.path.dirname(cover_path), os.path.basename(cover_path))
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        response.headers['Expires'] = (datetime.now(timezone.utc) + timedelta(days=365)).strftime("%a, %d %b %Y %H:%M:%S GMT")
        app.logger.debug(f"向客户端返回图片: {cover_path}")
        return response
    else:
        app.logger.debug(f"客户端获取图片失败: {cover_art_id}")
        return jsonify({'status': 'error', 'message': 'Cover art not found'}), 404
    

from datetime import datetime, timedelta, timezone

@app.route('/cover/o/<album_name>/<cover_art_id>')
def cover_o(album_name,cover_art_id):
    size = "2000"
    token, salt = generate_token(PASSWORD)
    cover_path = cache_cover_art(cover_art_id, token, salt, size, "jpg")  # 使用正确的文件扩展名
    app.logger.debug(f"客户端尝试获取图片原片: {album_name}-{cover_art_id}")
    if cover_path and os.path.exists(cover_path):
        # 发送文件并设置正确的 Content-Type 头
        response = send_from_directory(os.path.dirname(cover_path), os.path.basename(cover_path))
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        response.headers['Expires'] = (datetime.now(timezone.utc) + timedelta(days=365)).strftime("%a, %d %b %Y %H:%M:%S GMT")
        response.headers['Content-Type'] = 'image/jpeg'  # 设置正确的 Content-Type
        app.logger.debug(f"向客户端返回图片: {cover_path}")
        return response
    else:
        app.logger.debug(f"客户端获取图片失败: {cover_art_id}")
        return jsonify({'status': 'error', 'message': 'Cover art not found'}), 404



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

@app.route('/artist/<artist_id>')
def artist(artist_id):
    app.logger.debug(f"客户端尝试通过url访问艺术家详情: {artist_id}")
    return render_template('index.html', artist_id=artist_id)

@app.route('/albumlist/<page>')
def albumlist(page):
    app.logger.debug(f"客户端尝试通过url访问专辑列表: {page}")
    return render_template('index.html', page=page)

@app.route('/searchAlbums/<query>')
def searchAlbums(query):
    app.logger.debug(f"客户端尝试通过url访问专辑搜索: {query}")
    return render_template('index.html', query=query)

@app.route('/searchArtists/<query>')
def searchArtists(query):
    app.logger.debug(f"客户端尝试通过url访问艺术家搜索: {query}")
    return render_template('index.html', query=query)

@app.route('/searchSongs/<query>')
def searchSongs(query):
    app.logger.debug(f"客户端尝试通过url访问歌曲搜索: {query}")
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
    #print(stream_url)
    def generate():
        try:
            with requests.get(stream_url, stream=True) as r:
                r.raise_for_status()
                for chunk in r.iter_content(chunk_size=1024):
                    if chunk:
                        yield chunk
        except requests.RequestException as e:
            app.logger.error(f"Failed to stream song: {e}")
            yield b''

    return Response(generate(), content_type='audio/mp4', headers={
        'Content-Disposition': 'inline; filename="song.mp4"',
        'Cache-Control': 'public, max-age=31536000'
    })

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



