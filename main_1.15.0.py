from flask import Flask, render_template, jsonify, request, send_from_directory, Response, abort, make_response
import requests
import hashlib
import hmac
import time
import os
import logging
from datetime import datetime, timedelta, timezone

app = Flask(__name__, static_url_path='/static')

SECRET_KEY = 'ppp'
SUBSONIC_API_URL = 'http://10.39.160.20:4533/rest'
API_VERSION = '1.15.0'
CLIENT_NAME = 'pywebplayer'
USERNAME = os.getenv('SUBSONIC_USERNAME', 'test')  # 使用环境变量存储用户名
PASSWORD = os.getenv('SUBSONIC_PASSWORD', 'test')  # 使用环境变量存储密码
FLASKDEBUG = os.getenv('SUBSONIC_PASSWORD', 'False')

CACHE_DIR = 'cover_cache'
os.makedirs(CACHE_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO)


def generate_encrypted_param(song_id):
    timestamp = int(time.time())
    payload = f'{song_id}{timestamp}'
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f'{timestamp}:{signature}'

def verify_encrypted_param(song_id, encrypted_param):
    try:
        timestamp, signature = encrypted_param.split(':')
        timestamp = int(timestamp)
    except ValueError:
        return False

    current_time = int(time.time())
    if current_time - timestamp > 1800:  # 30 minutes
        return False

    payload = f'{song_id}{timestamp}'
    expected_signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_signature, signature)


def generate_token(password):
    """生成Subsonic API的认证token."""
    salt = os.urandom(16).hex()  # 使用随机生成的salt
    token = hashlib.md5((password + salt).encode('utf-8')).hexdigest()
    return token, salt

def cache_cover_art(cover_art_id, token, salt,size,filetype):
    """缓存封面图片并返回文件路径."""
    # 使用 cover_art_id 的前四个字符作为子目录名
    subdir = cover_art_id[:5]
    cover_dir = os.path.join(CACHE_DIR,size, subdir)
    cover_path = os.path.join(cover_dir, f'{cover_art_id+"."+filetype}')  # 修改文件后缀为 .webp
    print(cover_path)

    # 检查缓存目录是否存在，不存在则创建
    if not os.path.exists(cover_dir):
        os.makedirs(cover_dir)

    if not os.path.exists(cover_path):
        try:
            response = requests.get(f'{SUBSONIC_API_URL}/getCoverArt.view', params={
                'u': USERNAME,
                'p': PASSWORD,
                'v': API_VERSION,
                'c': CLIENT_NAME,
                'id': cover_art_id,
                'size': size,
                'f': type # 指定获取的图片格式为 WebP
            })
            response.raise_for_status()
            with open(cover_path, 'wb') as f:
                f.write(response.content)

            # 如果需要转换为 WebP 格式，可以添加以下代码（需要安装 Pillow 库）
            # image = Image.open(cover_path)
            # image.save(cover_path, 'webp')

        except requests.RequestException as e:
            logging.error(f"获取封面图片失败: {e}")
            return None
    print(cover_path)
    return cover_path

@app.route('/cover/<cover_art_id>')
def cover(cover_art_id):
    size = "300"
    token, salt = generate_token(PASSWORD)
    cover_path = cache_cover_art(cover_art_id, token, salt,size,'webp')
    if cover_path and os.path.exists(cover_path):
        response = send_from_directory(os.path.join(CACHE_DIR,size, cover_art_id[:5]), f'{cover_art_id}.webp')
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        response.headers['Expires'] = (datetime.now(timezone.utc) + timedelta(days=365)).strftime("%a, %d %b %Y %H:%M:%S GMT")
        return response
    else:
        return jsonify({'status': 'error', 'message': 'Cover art not found'}), 404
    

from datetime import datetime, timedelta, timezone

@app.route('/cover/o/<album_name>/<cover_art_id>')
def cover_o(album_name,cover_art_id):
    size = "2000"
    token, salt = generate_token(PASSWORD)
    cover_path = cache_cover_art(cover_art_id, token, salt, size, "jpg")  # 使用正确的文件扩展名
    if cover_path and os.path.exists(cover_path):
        # 发送文件并设置正确的 Content-Type 头
        response = make_response(send_from_directory(os.path.join(CACHE_DIR, size, cover_art_id[:5]), f'{cover_art_id}.jpg'))
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        response.headers['Expires'] = (datetime.now(timezone.utc) + timedelta(days=365)).strftime("%a, %d %b %Y %H:%M:%S GMT")
        response.headers['Content-Type'] = 'image/jpeg'  # 设置正确的 Content-Type
        return response
    else:
        return jsonify({'status': 'error', 'message': 'Cover art not found'}), 404



@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_albums/<page>')
def get_albums(page):
    token, salt = generate_token(PASSWORD)
    number = int(page)
    result = number * 20
    page = str(result)
    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getAlbumList.view', params={
            'u': USERNAME,
            'p': PASSWORD,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'type': 'newest',
            'size': '20',
            'offset': page
        })
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            albums = response.json()['subsonic-response'].get('albumList', {}).get('album', [])
            return jsonify({'status': 'ok', 'albums': albums})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        logging.error(f"Failed to get albums: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get albums'})


@app.route('/get_album_details/<album_id>')
def get_album_details(album_id):
    token, salt = generate_token(PASSWORD)

    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getAlbum.view', params={
            'u': USERNAME,
            'p': PASSWORD,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'id': album_id
        })
        print(response.text)
        print(response.url)
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            album = response.json()['subsonic-response'].get('album', {})
            return jsonify({'status': 'ok', 'album': album})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        logging.error(f"Failed to get album details: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get album details'})

@app.route('/albums/<album_id>')
def albums(album_id):
    return render_template('index.html', album_id=album_id)

@app.route('/artist/<artist_id>')
def artist(artist_id):
    return render_template('index.html', artist_id=artist_id)

@app.route('/albumlist/<page>')
def albumlist(page):
    return render_template('index.html', page=page)

@app.route('/searchAlbums/<query>')
def searchAlbums(query):
    return render_template('index.html', query=query)

@app.route('/searchArtists/<query>')
def searchArtists(query):
    return render_template('index.html', query=query)

@app.route('/searchSongs/<query>')
def searchSongs(query):
    return render_template('index.html', query=query)


@app.route('/getArtist/<artist_id>')
def getArtist(artist_id):
    token, salt = generate_token(PASSWORD)

    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getArtist.view', params={
            'u': USERNAME,
            'p': PASSWORD,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'id': artist_id
        })
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            artist = response.json()['subsonic-response'].get('artist', {})
            return jsonify({'status': 'ok', 'artist': artist})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        logging.error(f"Failed to get artist details: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get artist details'})
    
@app.route('/getIndexes')
def getIndexes():
    token, salt = generate_token(PASSWORD)

    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getIndexes.view', params={
            'u': USERNAME,
            'p': PASSWORD,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json'
        })
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            indexes = response.json()['subsonic-response'].get('indexes', {})
            return jsonify({'status': 'ok', 'indexes': indexes})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        logging.error(f"Failed to get indexes: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to get indexes'})

@app.route('/play/<song_id>')
def play_song(song_id):
    encrypted_param = request.args.get('token')
    
    if not encrypted_param or not verify_encrypted_param(song_id, encrypted_param):
        abort(403)  # Forbidden

    token, salt = generate_token(PASSWORD)
    stream_url = f'{SUBSONIC_API_URL}/stream.view?u={USERNAME}&t={token}&s={salt}&v={API_VERSION}&c={CLIENT_NAME}&id={song_id}'

    def generate():
        try:
            with requests.get(stream_url, stream=True) as r:
                r.raise_for_status()
                for chunk in r.iter_content(chunk_size=1024):
                    if chunk:
                        yield chunk
        except requests.RequestException as e:
            logging.error(f"Failed to stream song: {e}")
            yield b''

    return Response(generate(), content_type='audio/mp4')

@app.route('/generate_token/<song_id>')
def generate_token_endpoint(song_id):
    token = generate_encrypted_param(song_id)
    return jsonify({'token': token})


@app.route('/search')
def search():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)

    try:
        response = requests.get(f'{SUBSONIC_API_URL}/search2.view', params={
            'u': USERNAME,
            'p': PASSWORD,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'query': query,
            'albumCount': 50
        })
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            albums = response.json()['subsonic-response'].get('searchResult2', {}).get('album', [])
            return jsonify({'status': 'ok', 'albums': albums})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        logging.error(f"Failed to search albums: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to search albums'})

@app.route('/search_artists')
def search_artists():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)

    try:
        response = requests.get(f'{SUBSONIC_API_URL}/search2.view', params={
            'u': USERNAME,
            'p': PASSWORD,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'query': query,
            'artistCount': 100
        })
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            artists = response.json()['subsonic-response'].get('searchResult2', {}).get('artist', [])
            return jsonify({'status': 'ok', 'artists': artists})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        logging.error(f"Failed to search artists: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to search artists'})

@app.route('/search_songs')
def search_songs():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)

    try:
        response = requests.get(f'{SUBSONIC_API_URL}/search2.view', params={
            'u': USERNAME,
            'p': PASSWORD,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'query': query,
            'songCount': 100
        })
        response.raise_for_status()
        if response.json()['subsonic-response']['status'] == 'ok':
            songs = response.json()['subsonic-response'].get('searchResult2', {}).get('song', [])
            return jsonify({'status': 'ok', 'songs': songs})
        else:
            error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
            return jsonify({'status': 'error', 'message': error_message})
    except requests.RequestException as e:
        logging.error(f"Failed to search songs: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to search songs'})

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True)
