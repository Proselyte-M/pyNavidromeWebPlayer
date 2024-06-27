function playSong(songId, songTitle, coverArtId) {
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
        },
        error: function () {
            // 错误处理，显示警告信息
            alert('Failed to generate token');
        }
    });
}

function showPlayer() {
    $('#player').fadeIn(); // 使用jQuery淡入效果显示播放器区域
}

document.addEventListener('DOMContentLoaded', function () {
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('play-pause');
    const volumeControl = document.getElementById('volume-control');
    const progressBar = document.getElementById('progress-bar');

    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            event.preventDefault(); // 防止页面滚动
            togglePlayPause();
        }
    });
    function togglePlayPause() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseButton.textContent = '⏸️'; // 更改按钮显示为暂停图标
        } else {
            audioPlayer.pause();
            playPauseButton.textContent = '▶️'; // 更改按钮显示为播放图标
        }
    }
    playPauseButton.addEventListener('click', function () {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseButton.textContent = '⏸️';
        } else {
            audioPlayer.pause();
            playPauseButton.textContent = '▶️';
        }
    });

    volumeControl.addEventListener('input', function () {
        audioPlayer.volume = volumeControl.value;
    });

    audioPlayer.addEventListener('timeupdate', function () {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = progress;
    });

    progressBar.addEventListener('input', function () {
        const newTime = (progressBar.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = newTime;
    });
});
