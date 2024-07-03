async function playSong(songId, songTitle, coverArtId, artistName) {
    // 显示加载指示器
    console.info('Start play song:'+songId);
    $('#loading-spinner').show();
    
    try {
        // 发起请求以获取加密参数的 token
        let tokenResponse = await fetch('/generate_token/' + songId, {
            method: 'GET'
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to generate token');
        }

        let tokenData = await tokenResponse.json();
        let token = tokenData.token;
        let songUrl = '/play/' + songId + '?token=' + token;

        var newSong = {
            name: songTitle,
            artist: artistName,
            url: songUrl,
            cover: '/cover/' + coverArtId,
            theme: '#ebd0c2'
        };


        // 获取当前播放列表
        var playlist = ap.list.audios;
        //console.info(playlist);

        // 检查是否已存在相同的歌曲
        var isSongExist = playlist.some(function (song) {
            return song.name === newSong.name && song.artist === newSong.artist;
        });

        if (isSongExist) {
            console.info("Song already exists in playlist");
            var index = playlist.findIndex(function (song) {
                return song.name === newSong.name;
            });
            if (index !== -1) {
                ap.list.switch(index);
            }
        } else {
            // 将新歌曲添加到播放器中
            //console.log(newSong);
            ap.list.add(newSong);
            ap.setMode('normal')
            ap.list.show()
            ap.play()
            //ap.notice(artistName+'-'+songTitle, 2000, 0.8);
            playlist = ap.list.audios;
            // 使用 findIndex 方法查找序号
            var index = playlist.findIndex(function (song) {
                //console.info("song.name"+song.name);
                //console.info("newSong.name"+newSong.name);
                return song.name === newSong.name;
            });

            // 假设设置当前播放歌曲的方法是 setCurrentSongIndex
            if (index !== -1) {
                ap.list.switch(index);
            }
        }

    } catch (e) {
        // 错误处理，显示警告信息
        showErrorModal(e.message);
    } finally {
        // 隐藏加载指示器
        $('#loading-spinner').hide();
    }
}

function showErrorModal(message) {
    // 实现显示错误模态框的代码
    console.error(message); // 这里只是简单的输出错误信息到控制台
}

async function playAlbum(albumId) {
    console.info('Start play album:'+albumId);
    try {
        ap.list.clear()
        var url = '/get_album_details/' + albumId;
        let response = await fetch(url);
        let data = await response.json();
        console.debug(data);
        if (data.status === 'ok') {
            var songs = data.album.song;

            for (let song of songs) {
                let tokenResponse = await fetch('/generate_token/' + song.id);
                if (!tokenResponse.ok) {
                    throw new Error('Failed to generate token');
                }
                let tokenData = await tokenResponse.json();
                let token = tokenData.token;
                let songUrl = '/play/' + song.id + '?token=' + token;

                var newSong = {
                    name: song.title,
                    artist: song.artist,
                    url: songUrl,
                    cover: '/cover/' + song.coverArt,
                    theme: '#ebd0c2'
                };
                ap.list.add(newSong);
                ap.setMode('normal')
                ap.list.show()
                ap.play();
            }
        }
    } catch (error) {
        console.error('Error while playing album:', error);
        // Handle error gracefully, e.g., show a message to the user
    }
}

