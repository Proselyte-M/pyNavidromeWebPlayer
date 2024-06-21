from flask import Flask, render_template, jsonify, request, send_from_directory
import requests
import hashlib
import os

app = Flask(__name__)

SUBSONIC_API_URL = 'http://10.39.160.20:4533/rest'  # Subsonic API 基础 URL
API_VERSION = '1.16.1'  # API 版本
CLIENT_NAME = 'myapp'  # 客户端名称
USERNAME = 'test'  # 预定义用户名
PASSWORD = 'test'  # 预定义密码

# 创建缓存目录
CACHE_DIR = 'cover_cache'
os.makedirs(CACHE_DIR, exist_ok=True)

def generate_token(password):
    """生成Subsonic API的认证token."""
    salt = 'randomsalt'
    token = hashlib.md5((password + salt).encode('utf-8')).hexdigest()
    return token, salt

def cache_cover_art(cover_art_id, token, salt):
    """缓存封面图片并返回文件路径."""
    cover_path = os.path.join(CACHE_DIR, f'{cover_art_id}.jpg')
    
    if not os.path.exists(cover_path):
        response = requests.get(f'{SUBSONIC_API_URL}/getCoverArt.view', params={
            'u': USERNAME,
            't': token,
            's': salt,
            'v': API_VERSION,
            'c': CLIENT_NAME,
            'id': cover_art_id
        })
        if response.status_code == 200:
            with open(cover_path, 'wb') as f:
                f.write(response.content)
    
    return cover_path

@app.route('/cover/<cover_art_id>')
def cover(cover_art_id):
    token, salt = generate_token(PASSWORD)
    cover_path = cache_cover_art(cover_art_id, token, salt)
    return send_from_directory(CACHE_DIR, f'{cover_art_id}.jpg')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_albums')
def get_albums():
    token, salt = generate_token(PASSWORD)
    
    # 使用 Subsonic API 获取专辑列表
    response = requests.get(f'{SUBSONIC_API_URL}/getAlbumList.view', params={
        'u': USERNAME,
        't': token,
        's': salt,
        'v': API_VERSION,
        'c': CLIENT_NAME,
        'f': 'json',
        'type': 'random'
    })

    if response.status_code == 200 and response.json()['subsonic-response']['status'] == 'ok':
        albums = response.json()['subsonic-response'].get('albumList', {}).get('album', [])
        return jsonify({'status': 'ok', 'albums': albums})
    else:
        error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
        return jsonify({'status': 'error', 'message': error_message})

@app.route('/get_album_details/<album_id>')
def get_album_details(album_id):
    token, salt = generate_token(PASSWORD)
    
    # 使用 Subsonic API 获取专辑详情
    response = requests.get(f'{SUBSONIC_API_URL}/getAlbum.view', params={
        'u': USERNAME,
        't': token,
        's': salt,
        'v': API_VERSION,
        'c': CLIENT_NAME,
        'f': 'json',
        'id': album_id
    })

    if response.status_code == 200 and response.json()['subsonic-response']['status'] == 'ok':
        album = response.json()['subsonic-response'].get('album', {})
        return jsonify({'status': 'ok', 'album': album})
    else:
        error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
        return jsonify({'status': 'error', 'message': error_message})

@app.route('/play/<song_id>')
def play_song(song_id):
    token, salt = generate_token(PASSWORD)
    
    # 使用 Subsonic API 获取歌曲播放URL
    stream_url = f'{SUBSONIC_API_URL}/stream.view?u={USERNAME}&t={token}&s={salt}&v={API_VERSION}&c={CLIENT_NAME}&id={song_id}'
    return jsonify({'status': 'ok', 'stream_url': stream_url})

@app.route('/search')
def search():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)
    
    # 使用 Subsonic API 搜索专辑
    response = requests.get(f'{SUBSONIC_API_URL}/search2.view', params={
        'u': USERNAME,
        't': token,
        's': salt,
        'v': API_VERSION,
        'c': CLIENT_NAME,
        'f': 'json',
        'query': query,
        'albumCount': 20  # 限制返回的专辑数量
    })

    if response.status_code == 200 and response.json()['subsonic-response']['status'] == 'ok':
        albums = response.json()['subsonic-response'].get('searchResult2', {}).get('album', [])
        return jsonify({'status': 'ok', 'albums': albums})
    else:
        error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
        return jsonify({'status': 'error', 'message': error_message})

@app.route('/search_artists')
def search_artists():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)
    
    # 使用 Subsonic API 搜索艺术家
    response = requests.get(f'{SUBSONIC_API_URL}/search2.view', params={
        'u': USERNAME,
        't': token,
        's': salt,
        'v': API_VERSION,
        'c': CLIENT_NAME,
        'f': 'json',
        'query': query,
        'artistCount': 20  # 限制返回的艺术家数量
    })

    if response.status_code == 200 and response.json()['subsonic-response']['status'] == 'ok':
        artists = response.json()['subsonic-response'].get('searchResult2', {}).get('artist', [])
        return jsonify({'status': 'ok', 'artists': artists})
    else:
        error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
        return jsonify({'status': 'error', 'message': error_message})

@app.route('/search_songs')
def search_songs():
    query = request.args.get('query', '')
    token, salt = generate_token(PASSWORD)
    
    # 使用 Subsonic API 搜索歌曲
    response = requests.get(f'{SUBSONIC_API_URL}/search2.view', params={
        'u': USERNAME,
        't': token,
        's': salt,
        'v': API_VERSION,
        'c': CLIENT_NAME,
        'f': 'json',
        'query': query,
        'songCount': 20  # 限制返回的歌曲数量
    })

    if response.status_code == 200 and response.json()['subsonic-response']['status'] == 'ok':
        songs = response.json()['subsonic-response'].get('searchResult2', {}).get('song', [])
        return jsonify({'status': 'ok', 'songs': songs})
    else:
        error_message = response.json()['subsonic-response'].get('error', {}).get('message', 'Unknown error')
        return jsonify({'status': 'error', 'message': error_message})

if __name__ == '__main__':
    app.run(debug=True)
