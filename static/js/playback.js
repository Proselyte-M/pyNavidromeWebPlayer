async function playSong(songId, songTitle, coverArtId, artistName) {
    // 显示加载指示器
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
            src: songUrl,
            poster: '/cover/' + coverArtId,
            name: songTitle,
            artist: artistName
        };

        // 获取当前播放列表
        var playlist = player.playlist;

        // 检查是否已存在相同的歌曲
        var isSongExist = playlist.some(function (song) {
            return song.name === newSong.name && song.artist === newSong.artist;
        });

        if (isSongExist) {
            console.info("Song already exists in playlist");
        } else {
            // 将新歌曲添加到播放器中
            console.log(newSong);
            player.add(newSong);
            player.view.showPlaylist();
            player.play();
            // 使用 findIndex 方法查找序号
            var index = playlist.findIndex(function (song) {
                return song.name === newSong.name && song.artist === newSong.artist;
            });

            // 假设设置当前播放歌曲的方法是 setCurrentSongIndex
            if (index !== -1) {
                player.to(index);
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
