from flask import Flask, render_template, jsonify, request, send_from_directory, Response
import requests
import hashlib
import os
import logging

app = Flask(__name__, static_url_path='/static')

SUBSONIC_API_URL = 'http://10.39.160.20:4533/rest'
API_VERSION = '1.16.1'
CLIENT_NAME = 'pywebplayer'
USERNAME = os.getenv('SUBSONIC_USERNAME', 'test')  # 使用环境变量存储用户名
PASSWORD = os.getenv('SUBSONIC_PASSWORD', 'test')  # 使用环境变量存储密码

CACHE_DIR = 'cover_cache'
os.makedirs(CACHE_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO)

def generate_token(password):
    """生成Subsonic API的认证token."""
    salt = os.urandom(16).hex()  # 使用随机生成的salt
    token = hashlib.md5((password + salt).encode('utf-8')).hexdigest()
    return token, salt

def cache_cover_art(cover_art_id, token, salt):
    """缓存封面图片并返回文件路径."""
    # 使用 cover_art_id 的前四个字符作为子目录名
    subdir = cover_art_id[:5]
    cover_dir = os.path.join(CACHE_DIR, subdir)
    cover_path = os.path.join(cover_dir, f'{cover_art_id}.jpg')

    # 检查缓存目录是否存在，不存在则创建
    if not os.path.exists(cover_dir):
        os.makedirs(cover_dir)

    if not os.path.exists(cover_path):
        try:
            response = requests.get(f'{SUBSONIC_API_URL}/getCoverArt.view', params={
                'u': USERNAME,
                't': token,
                's': salt,
                'v': API_VERSION,
                'c': CLIENT_NAME,
                'id': cover_art_id,
                'size': '300'
            })
            response.raise_for_status()
            with open(cover_path, 'wb') as f:
                f.write(response.content)
        except requests.RequestException as e:
            logging.error(f"获取封面图片失败: {e}")
            return None

    return cover_path

@app.route('/cover/<cover_art_id>')
def cover(cover_art_id):
    token, salt = generate_token(PASSWORD)
    cover_path = cache_cover_art(cover_art_id, token, salt)
    if cover_path and os.path.exists(cover_path):
        subdir = cover_art_id[:5]
        return send_from_directory(os.path.join(CACHE_DIR, subdir), f'{cover_art_id}.jpg')
    else:
        return jsonify({'status': 'error', 'message': 'Cover art not found'}), 404

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_albums')
def get_albums():
    token, salt = generate_token(PASSWORD)

    try:
        response = requests.get(f'{SUBSONIC_API_URL}/getAlbumList.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'type': 'random',
            'size': '20'
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
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'f': 'json',
            'id': album_id
        })
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

@app.route('/getArtist/<artist_id>')
def getArtist(artist_id):
    token, salt = generate_token(PASSWORD)

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
            't': token,
            's': salt,
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

@app.route('/search')
def search():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)

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
            't': token,
            's': salt,
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
            't': token,
            's': salt,
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
    app.run(host='0.0.0.0', debug=True)
