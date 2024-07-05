import sqlite3
import requests
import json
from difflib import get_close_matches

def find_closest_match(json_data, target_value):
    albums = [item[2] for item in json_data]
    closest_matches = get_close_matches(target_value, albums)
    return closest_matches

class THWikiAlbumScraper:
    def __init__(self, db_path='thwikiinfo.db'):
        self.base_url = "https://thwiki.cc/album.php"
        self.db_path = db_path
        self._initialize_database()

    def _initialize_database(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS album_info (
                artist_name TEXT,
                album_name TEXT,
                info TEXT,
                PRIMARY KEY (artist_name, album_name)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS album_detail (
                album_id TEXT PRIMARY KEY,
                detail TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def get_album_info(self, artist_name, album_name):
        # 首先在本地数据库中查找
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT info FROM album_info WHERE artist_name = ? AND album_name = ?
        ''', (artist_name, album_name))
        result = cursor.fetchone()
        if result:
            conn.close()
            return json.loads(result[0])  # 返回存储的 JSON 数据

        # 如果本地没有找到，则从网络获取
        params = {
            "m": "0",
            "g": "2",
            "o": "1",
            "d": "nm",
            "l": "10",
            "v": album_name
        }
        response = requests.get(self.base_url, params=params)
        print(response.text)
        if response.status_code == 200:
            try:
                json_data = json.loads(response.text)
            except json.JSONDecodeError:
                return ""

            albums = set(item[1] for item in json_data)
            num_albums = len(albums)
            if num_albums == 0:
                return ""
            elif num_albums == 1:
                # 保存到本地数据库
                cursor.execute('''
                    INSERT OR REPLACE INTO album_info (artist_name, album_name, info)
                    VALUES (?, ?, ?)
                ''', (artist_name, album_name, json.dumps(json_data[0])))
                conn.commit()
                conn.close()
                return json_data[0]  # 返回整个 JSON 数据作为示例
            else:
                closest_matches = find_closest_match(json_data, artist_name)
                if closest_matches:
                    matched_album = next((item for item in json_data if item[2] == closest_matches[0]), None)
                    if matched_album:
                        # 保存到本地数据库
                        cursor.execute('''
                            INSERT OR REPLACE INTO album_info (artist_name, album_name, info)
                            VALUES (?, ?, ?)
                        ''', (artist_name, album_name, json.dumps(matched_album)))
                        conn.commit()
                        conn.close()
                        return matched_album
                    else:
                        conn.close()
                        return "No close matches found"
                else:
                    conn.close()
                    return "No close matches found"
        else:
            conn.close()
            return f"Error fetching data: {response.status_code}"
        
    def get_album_detail(self, album_id):
        # 首先在本地数据库中查找
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT detail FROM album_detail WHERE album_id = ?
        ''', (album_id,))
        result = cursor.fetchone()
        if result:
            conn.close()
            return json.loads(result[0])  # 返回存储的 JSON 数据

        # 如果本地没有找到，则从网络获取
        params = {
            "m": "2",
            "g": "2",
            "o": "1",
            "d": "kv",
            "s": "/",
            "f": "alname+circle+event+date+official+coverurl+coverchar",
            "p": "name+discno+trackno+time+artist+ogmusic",
            "a": album_id
        }
        response = requests.get(self.base_url, params=params)
        if response.status_code == 200:
            try:
                json_data = json.loads(response.text)
                # 保存到本地数据库
                cursor.execute('''
                    INSERT OR REPLACE INTO album_detail (album_id, detail)
                    VALUES (?, ?)
                ''', (album_id, json.dumps(json_data)))
                conn.commit()
                conn.close()
                return json_data
            except json.JSONDecodeError:
                print(response.text)
                conn.close()
                return "Error decoding JSON data"
        else:
            conn.close()
            return f"Error fetching data: {response.status_code}"