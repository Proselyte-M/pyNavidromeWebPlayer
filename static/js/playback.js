function playSong(songId, songTitle, coverArtId) {
    // 发起 AJAX 请求以获取歌曲数据
    $.ajax({
        url: '/play/' + songId,
        method: 'GET',
        xhrFields: {
            responseType: 'blob'  // 确保返回的数据类型是 Blob
        },
        success: function (data) {
            // 创建指向 Blob 对象的临时 URL
            var audioUrl = URL.createObjectURL(data);
            // 更新音频播放器源
            var audioPlayer = $('#audio-player');
            audioPlayer.attr('src', audioUrl);
            
            // 更新歌曲标题
            $('#current-song-title').text(songTitle);
            
            // 更新专辑封面
            $('#current-album-cover').attr('src', '/cover/' + coverArtId);
            
            // 显示播放器并播放歌曲
            $('#player').removeClass('d-none');
            audioPlayer[0].play();
            showPlayer();
            
            // 绑定音频播放进度更新事件
            audioPlayer.on('timeupdate', function () {
                var progressBar = $('#progress-bar');
                var currentTime = audioPlayer[0].currentTime;
                var duration = audioPlayer[0].duration;
                
                if (duration > 0) {
                    var percent = (currentTime / duration) * 100;
                    progressBar.val(percent);
                }
            });
            
            // 允许用户通过拖动进度条调整播放进度
            $('#progress-bar').on('input', function () {
                var progressBar = $(this);
                var percent = progressBar.val();
                var duration = audioPlayer[0].duration;
                
                if (duration > 0) {
                    var newTime = (percent / 100) * duration;
                    audioPlayer[0].currentTime = newTime;
                }
            });
        },
        error: function () {
            // 错误处理，显示警告信息
            alert('Failed to play song');
        }
    });
}

function showPlayer() {
    $('#player').fadeIn(); // 使用jQuery淡入效果显示播放器区域
}

