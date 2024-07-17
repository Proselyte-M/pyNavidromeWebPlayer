const colorThief = new ColorThief();
const image = new Image();
const xhr = new XMLHttpRequest();

var ap = creatAplayer()

ap.on('listshow', function () {
    setTimeout(function () {
        ap.list.hide();
    }, 10000); // 10000毫秒 = 10秒
});

function creatAplayer() {
    const ap = new APlayer({
        container: document.getElementById('aplayer'),
        autoplay: true,
        fixed: true,
        //theme: '#e9e9e9',
        loop: 'none'
    });
    return ap;
}

async function getToken(songId) {
    let tokenResponse = await fetch('/generate_token/' + songId, { method: 'GET' });
    if (!tokenResponse.ok) {
        throw new Error('Failed to generate token');
    }
    let tokenData = await tokenResponse.json();
    return tokenData.token;
}

function createSongObject(songTitle, artistName, songUrl, coverArtId) {
    var metaTag = document.querySelector('meta[property="og:image"]');
    if (metaTag) {
        metaTag.setAttribute('content', '/newcover/' + playerCoverSize + '/' +  coverArtId);
    } else {
        var newMetaTag = document.createElement('meta');
        newMetaTag.setAttribute('property', 'og:image');
        newMetaTag.setAttribute('content', '/newcover/' + playerCoverSize + '/' + coverArtId);
        document.head.appendChild(newMetaTag);
    }
    return {
        name: songTitle,
        artist: artistName,
        url: songUrl,
        cover: '/newcover/' + playerCoverSize + '/' + coverArtId,
        //theme: '#ebd0c2' // 默认主题颜色，可以在之后更新
    };
}

function showErrorModal(message) {
    console.error(message); // 简单的输出错误信息到控制台
}

function changeTitle(index) {
    setTimeout(function () {
        var title = ap.list.audios[index].name + " - " + ap.list.audios[0].artist;
        document.title = title;
    }, 1000); // 延迟1秒（1000毫秒）
}



async function playSong(songId, songTitle, coverArtId, artistName) {
    console.info('Start play song: ' + songId);
    $('#loading-spinner').show();

    try {
        let token = await getToken(songId);
        let songUrl = '/play/' + songId + '?token=' + token;
        var newSong = createSongObject(songTitle, artistName, songUrl, coverArtId);

        var playlist = ap.list.audios;
        var isSongExist = playlist.some(song => song.name === newSong.name && song.artist === newSong.artist);

        if (isSongExist) {
            console.info("Song already exists in playlist");
            var index = playlist.findIndex(song => song.name === newSong.name);
            if (index !== -1) {
                ap.list.switch(index);
            }
        } else {
            ap.list.add(newSong);
            ap.setMode('normal');
            ap.list.show();
            ap.play();
            playlist = ap.list.audios;
            var index = playlist.findIndex(song => song.name === newSong.name && song.artist === newSong.artist);
            if (index !== -1) {
                ap.list.switch(index);
            }
            changeTitle(index); // 设置主题颜色
        }
    } catch (e) {
        showErrorModal(e.message);
    } finally {
        $('#loading-spinner').hide();
    }
}

async function playAlbum(albumId) {
    console.info('Start play album: ' + albumId);
    $('#loading-spinner').show();

    try {
        ap.list.clear();
        let response = await fetch('/get_album_details/' + albumId);
        let data = await response.json();

        if (data.status === 'ok') {
            var songs = data.album.song;

            for (let song of songs) {
                let token = await getToken(song.id);
                let songUrl = '/play/' + song.id + '?token=' + token;
                var newSong = createSongObject(song.title, song.artist, songUrl, song.coverArt);

                ap.list.add(newSong);
                ap.setMode('normal');
                ap.list.show();
                ap.play();
            }

            // 设置专辑封面的主题颜色
            changeTitle(0); // 假设播放专辑时，从第一首歌开始播放
        }
    } catch (error) {
        console.error('Error while playing album:', error);
        showErrorModal(error.message);
    } finally {
        $('#loading-spinner').hide();
    }
}

// 设置列表切换时的主题颜色
ap.on('listswitch', (index) => {
    changeTitle(index.index);
});

ap.on('destroy', (index) => {
    ap = creatAplayer()
});