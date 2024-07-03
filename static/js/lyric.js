class AumNetEaseSource {
    constructor() {
        this.mArtist = '';
        this.cArtist = '';
        this.mTitle = '';
        this.cTitle = '';
    }

    getLyricsList(artist, title, info) {
        artist = artist.trim();
        this.mArtist = artist;
        this.cArtist = this.getCleanStr(artist);

        title = title.trim();
        this.mTitle = title;
        this.cTitle = this.getCleanStr(title);

        return AumNetEaseHandler.search(this.mTitle, this.mArtist).then(list => {
            if (list.length === 0) {
                return 0;
            }

            const exactMatchArray = [];
            const partialMatchArray = [];
            for (const item of list) {
                const cSong = this.getCleanStr(item.song);
                if (this.cTitle === cSong) {
                    exactMatchArray.push(item);
                } else if (this.isPartialMatch(cSong, this.cTitle)) {
                    partialMatchArray.push(item);
                }
            }

            if (exactMatchArray.length === 0 && partialMatchArray.length === 0) {
                return 0;
            }

            let foundArray = [];
            if (exactMatchArray.length > 0) {
                foundArray = this.findSongItems(exactMatchArray);
            }

            if (foundArray.length === 0 && partialMatchArray.length > 0) {
                foundArray = this.findSongItems(partialMatchArray);
            }

            if (foundArray.length === 0) {
                return 0;
            }

            foundArray.sort(this.compare.bind(this));
            for (const item of foundArray) {
                info.addTrackInfoToList(item.singers.join('&'), item.song, item.id, item.des);
            }
            return foundArray.length;
        });
    }

    getLyrics(id, info) {
        return AumNetEaseHandler.downloadLyric(id).then(lyric => {
            if (lyric === '') {
                return false;
            }
            info.addLyrics(this.decodeHtmlSpecialChars(lyric), id);
            return true;
        });
    }

    compare(lhs, rhs) {
        const scoreTitleL = this.getStringSimilarPercent(this.mTitle, lhs.song);
        const scoreTitleR = this.getStringSimilarPercent(this.mTitle, rhs.song);
        const scoreArtistL = this.getStringSimilarPercent(this.mArtist, lhs.singers.join('&'));
        const scoreArtistR = this.getStringSimilarPercent(this.mArtist, rhs.singers.join('&'));

        return scoreTitleR + scoreArtistR - scoreTitleL - scoreArtistL;
    }

    getStringSimilarPercent(lhs, rhs) {
        let matches = 0;
        for (let i = 0; i < Math.min(lhs.length, rhs.length); i++) {
            if (lhs[i] === rhs[i]) {
                matches++;
            }
        }
        return (2 * matches) / (lhs.length + rhs.length);
    }

    isPartialMatch(lhs, rhs) {
        return lhs.includes(rhs) || rhs.includes(lhs);
    }

    findSongItems(songArray) {
        const foundArray = [];
        for (const item of songArray) {
            for (const singer of item.singers) {
                const cSinger = this.getCleanStr(singer);
                if (this.isPartialMatch(this.cArtist, cSinger)) {
                    foundArray.push(item);
                    break;
                }
            }
        }
        return foundArray;
    }

    decodeHtmlSpecialChars(str) {
        const textArea = document.createElement('textarea');
        textArea.innerHTML = str;
        return textArea.value;
    }

    getCleanStr(str) {
        return str.toLowerCase().replace(/[\s，：；！？「」（）。❤]/g, match => {
            const map = {
                ' ': '',
                '，': ',',
                '：': ':',
                '；': ';',
                '！': '!',
                '？': '?',
                '「': '｢',
                '」': '｣',
                '（': '(',
                '）': ')',
                '。': '.',
                '❤': '♥'
            };
            return map[match];
        });
    }
}
class AumNetEaseHandler {
    static siteSearch = 'https://music.163.com/api/search/get/web';
    static siteDownload = 'https://music.163.com/api/song/lyric?os=pc&lv=-1&kv=0&tv=-1&id=';
    static userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36';

    static getContent(url, defaultValue, isPost = false, postParams = null) {
        const options = {
            method: isPost ? 'POST' : 'GET',
            headers: {
                'User-Agent': this.userAgent,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        if (isPost && postParams) {
            options.body = new URLSearchParams(postParams).toString();
        }

        return fetch(url, options)
            .then(response => response.text())
            .catch(() => defaultValue);
    }

    static search(title, artist) {
        const params = {
            s: `${title} ${artist}`,
            offset: '0',
            limit: '20',
            type: '1'
        };

        return this.getContent(this.siteSearch, '{"result":{"songs":[]}}', true, params).then(jsonContent => {
            const json = JSON.parse(jsonContent);
            const songArray = json.result.songs || [];
            const results = [];
            const idArray = [];

            for (const songItem of songArray) {
                if (idArray.includes(songItem.id)) continue;

                const song = songItem.name;
                const id = songItem.id;
                idArray.push(id);
                const singers = songItem.artists.map(singer => singer.name);
                const des = songItem.album.name;

                results.push({ song, id, singers, des });
            }
            return results;
        });
    }

    static downloadLyric(songId) {
        const url = `${this.siteDownload}${songId}`;
        return this.getContent(url, '{"lrc":{"lyric":""},"tlyric":{"lyric":""}}').then(jsonContent => {
            const json = JSON.parse(jsonContent);
            let lyric = json.lrc.lyric;
            const transLyric = json.tlyric.lyric;

            if (transLyric.length > 0) {
                const tl = new AumNetEaseTranslation(lyric, transLyric);
                lyric = tl.getChineseTranslationLrc();
            }
            return lyric;
        });
    }
}
class AumNetEaseTranslation {
    constructor(orgLrc, transLrc) {
        this.orgLrc = orgLrc;
        this.transLrc = transLrc;
    }

    getLrcTime(str) {
        const key = str.substring(0, str.indexOf(']') + 1);
        return key === '' ? '' : key;
    }

    getLrcText(str, key) {
        return key === '' ? str : str.replace(key, '');
    }

    isValidLrcTime(str) {
        if (str.trim() === '' || str[0] !== '[') {
            return false;
        }

        const keyLen = str.length;
        if (keyLen < 9 || keyLen > 11) {
            return false;
        }

        for (let count = 1; count < keyLen - 1; count++) {
            const ch = str[count];
            if (ch !== ':' && ch !== '.' && isNaN(ch)) {
                return false;
            }
        }

        return true;
    }

    isValidLrcText(str) {
        return str.trim() !== '' && str.trim() !== '//';
    }

    getTimeFromTag(tag) {
        const min = parseInt(tag.substring(1, 3), 10);
        const sec = parseInt(tag.substring(4, 6), 10);
        let milStr = tag.substring(7, tag.length - 1);
        milStr = milStr.padEnd(3, '0');
        const mil = parseInt(milStr, 10);
        return mil + sec * 1000 + min * 60 * 1000;
    }

    compareTime(lTime, rTime) {
        const subVal = lTime - rTime;
        if (subVal > 100) {
            return 1;
        } else if (subVal < -100) {
            return -1;
        } else {
            return 0;
        }
    }

    processLrcLine(lrc) {
        return lrc.split('\n').map(line => {
            line = line.trim();
            const key = this.getLrcTime(line);
            let value = this.getLrcText(line, key);
            if (!this.isValidLrcTime(key)) {
                value = line;
            }
            return { tag: key, lrc: value.trim() };
        });
    }

    getChineseTranslationLrc() {
        let resultLrc = '';
        const orgLines = this.processLrcLine(this.orgLrc);
        const transLines = this.processLrcLine(this.transLrc);

        let transCursor = 0;
        for (const line of orgLines) {
            const key = line.tag;
            const value = line.lrc;
            resultLrc += key + value;

            let trans = '';
            if (key !== '') {
                const time = this.getTimeFromTag(key);
                for (let i = transCursor; i < transLines.length; i++) {
                    const tKey = transLines[i].tag;
                    if (tKey === '') continue;

                    const tTime = this.getTimeFromTag(tKey);
                    if (this.compareTime(tTime, time) > 0) {
                        transCursor = i;
                        break;
                    }

                    const tValue = transLines[i].lrc;
                    if (this.compareTime(tTime, time) === 0) {
                        transCursor = i + 1;
                        trans = tValue;
                        break;
                    }
                }
            }

            if (this.isValidLrcText(trans)) {
                resultLrc += ` 【${trans}】`;
            }
            resultLrc += '\n';
        }
        return resultLrc;
    }
}


