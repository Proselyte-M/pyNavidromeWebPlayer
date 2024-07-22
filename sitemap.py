import requests
import xml.etree.ElementTree as ET
from datetime import datetime

# 获取专辑列表的总页数
TOTAL_PAGES = 722

def get_album_urls():
    album_urls = []
    for page in range(1, TOTAL_PAGES + 1):
        try:
            url = f'http://127.0.0.1:5000/get_albums/{page}'
            response = requests.get(url)
            response.raise_for_status()  # 检查请求是否成功
            data = response.json()
            for album in data['albums']:
                album_id = album['id']
                album_url = f'http://127.0.0.1:5000/albumlist/{album_id}'
                album_urls.append(album_url)
        except requests.RequestException as e:
            print(f"Error fetching albums for page {page}: {e}")
    return album_urls

def get_artist_urls():
    artist_urls = []
    try:
        url = 'http://127.0.0.1:5000/getIndexes'
        response = requests.get(url)
        response.raise_for_status()  # 检查请求是否成功
        data = response.json()
        for index in data['indexes']['index']:
            for artist in index['artist']:
                artist_id = artist['id']
                artist_url = f'http://127.0.0.1:5000/artist/{artist_id}'
                artist_urls.append(artist_url)
    except requests.RequestException as e:
        print(f"Error fetching artist indexes: {e}")
    return artist_urls

def generate_sitemap(urls, filename='static\sitemap.xml'):
    urlset = ET.Element('urlset', xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for url in urls:
        url_element = ET.Element('url')
        
        loc = ET.Element('loc')
        loc.text = url
        url_element.append(loc)
        
        lastmod = ET.Element('lastmod')
        lastmod.text = datetime.now().strftime('%Y-%m-%dT%H:%M:%S+00:00')
        url_element.append(lastmod)
        
        changefreq = ET.Element('changefreq')
        changefreq.text = 'weekly'
        url_element.append(changefreq)
        
        priority = ET.Element('priority')
        if 'albumlist' in url:
            priority.text = '0.8'
        elif 'artist' in url:
            priority.text = '0.6'
        else:
            priority.text = '0.5'
        url_element.append(priority)
        
        urlset.append(url_element)

    tree = ET.ElementTree(urlset)
    with open(filename, 'wb') as f:
        tree.write(f, encoding='utf-8', xml_declaration=True)
        
    # 使XML更具可读性
    import xml.dom.minidom
    dom = xml.dom.minidom.parseString(ET.tostring(urlset, 'utf-8'))
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(dom.toprettyxml(indent="  "))

if __name__ == '__main__':
    print("Fetching album URLs...")
    album_urls = get_album_urls()
    print(f"Fetched {len(album_urls)} album URLs.")
    
    print("Fetching artist URLs...")
    artist_urls = get_artist_urls()
    print(f"Fetched {len(artist_urls)} artist URLs.")
    
    all_urls = album_urls + artist_urls
    print(f"Generating sitemap with {len(all_urls)} URLs...")
    generate_sitemap(all_urls)
    print("Sitemap has been generated successfully.")
