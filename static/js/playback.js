




function playSong(songId, songTitle, coverArtId,artistName) {
    showPlayer()
    // 发起 AJAX 请求以获取加密参数的 token
    $.ajax({
        url: '/generate_token/' + songId,
        method: 'GET',
        success: function (response) {
            var token = response.token;

            // 使用带有加密参数的 token 发起歌曲数据请求
            $.ajax({
                url: '/play/' + songId + '?token=' + token,
                method: 'GET',
                xhrFields: {
                    responseType: 'blob'  // 确保返回的数据类型是 Blob
                },
                success: function (data) {
                    var newSong = {
                        src: URL.createObjectURL(data),
                        poster: '/cover/' + coverArtId,
                        name: songTitle,
                        artist: artistName  // 这里替换成实际的艺术家名
                    };

                    // 将新歌曲添加到播放器中
                    console.log(newSong);
                    player.add(newSong);

                    player.play();
                    player.view.showPlaylist()

                    // 隐藏加载指示器
                    $('#loading-spinner').hide();
                },
                error: function () {
                    // 错误处理，显示警告信息
                    showErrorModal('Failed to play song. Please try again later.');
                    $('#loading-spinner').hide();
                }
            });
        },
        error: function () {
            // 错误处理，显示警告信息
            showErrorModal('Failed to generate token. Please try again later.');
            $('#loading-spinner').hide();
        }
    });
}

function showPlayer() {
    $('#player').fadeIn(); // 使用jQuery淡入效果显示播放器区域
}