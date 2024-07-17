import requests
import json
import os
from datetime import datetime

# 获取专辑列表的总页数
TOTAL_PAGES = 722

def fetch_album_data():
    albums_data = []
    for page in range(1, TOTAL_PAGES + 1):
        try:
            url = f'http://127.0.0.1:5000/get_albums/{page}'
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            albums_data.extend(data['albums'])
        except requests.RequestException as e:
            print(f"Error fetching albums for page {page}: {e}")
    return albums_data

def fetch_artist_data():
    artists_data = []
    try:
        url = 'http://127.0.0.1:5000/getIndexes'
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        for index in data['indexes']['index']:
            artists_data.extend(index['artist'])
    except requests.RequestException as e:
        print(f"Error fetching artist indexes: {e}")
    return artists_data

def generate_html_with_schema(albums, artists, filename='static\sitemap_with_schema.html'):
    html_content = '''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Site Map with Schema.org Data</title>
</head>
<body>
    <h1>Site Map with Schema.org Data</h1>
    <div>
        <h2>Albums</h2>
        <ul>
    '''
    
    for album in albums:
        album_name = album['album']
        album_artist = album['artist']
        album_id = album['id']
        album_url = f'http://127.0.0.1:5000/albums/{album_id}'
        last_mod = datetime.now().strftime('%Y-%m-%dT%H:%M:%S+00:00')
        
        album_schema = {
            "@context": "https://schema.org",
            "@type": "MusicAlbum",
            "name": album_name,
            "byArtist": {
                "@type": "MusicGroup",
                "name": album_artist
            },
            "url": album_url,
            "dateModified": last_mod
        }
        
        html_content += f'''
            <li>
                <a href="{album_url}">{album_name} by {album_artist}</a>
                <script type="application/ld+json">
                    {json.dumps(album_schema, indent=4)}
                </script>
            </li>
        '''
    
    html_content += '''
        </ul>
    </div>
    <div>
        <h2>Artists</h2>
        <ul>
    '''
    
    for artist in artists:
        artist_name = artist['name']
        artist_id = artist['id']
        artist_url = f'http://127.0.0.1:5000/artist/{artist_id}'
        last_mod = datetime.now().strftime('%Y-%m-%dT%H:%M:%S+00:00')
        
        artist_schema = {
            "@context": "https://schema.org",
            "@type": "MusicGroup",
            "name": artist_name,
            "url": artist_url,
            "dateModified": last_mod
        }
        
        html_content += f'''
            <li>
                <a href="{artist_url}">{artist_name}</a>
                <script type="application/ld+json">
                    {json.dumps(artist_schema, indent=4)}
                </script>
            </li>
        '''
    
    html_content += '''
        </ul>
    </div>
</body>
</html>
    '''
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"HTML file '{filename}' with Schema.org data has been generated successfully.")

if __name__ == '__main__':
    print("Fetching album data...")
    albums = fetch_album_data()
    print(f"Fetched {len(albums)} albums.")
    
    print("Fetching artist data...")
    artists = fetch_artist_data()
    print(f"Fetched {len(artists)} artists.")
    
    generate_html_with_schema(albums, artists)
