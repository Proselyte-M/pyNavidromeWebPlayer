function loadAlbums(page) {
    $('#up-button').prop('disabled', false);
    $('#down-button').prop('disabled', false);
    console.log('Loading albums...');
    $('#content').html('<p>Loading albums...</p>'); // 显示加载中信息
    history.pushState(null, '', `/albumlist/${page}`);  // 这里可以根据需要自定义URL路径
    $.getJSON(`/get_albums/${page}`, function (data) {
        //console.log(data);
        if (data.status === 'ok') { 
            var albumsHtml = "";
            albumsHtml += `<div>`;
            albumsHtml += `<h5 class="card-title">最新音乐-第${page}页</h5>`;
            albumsHtml += `</div>`;
            albumsHtml += '<div class="row">';
            
            // 获取相册数量
            var albumCount = data.albums.length;
            // 随机选择一个封面索引
            var randomIndex = Math.floor(Math.random() * albumCount);
            var randomAlbum = data.albums[randomIndex];
            
            // 设置背景图片

            
            data.albums.forEach(function (album) {
                albumsHtml += '<div class="col-md-2 col-2 mb-4">'; // 调整为col-md-2
                albumsHtml += '<div class="card shadow-sm">';
                albumsHtml += `<div class="square-img-container">`;
                
                // 使用 .card-img-top 类来确保图片正常显示
                albumsHtml += `<img class="card-img-top square-img" src="/cover/${album.coverArt}" alt="${album.album} Album Cover - TouHou Music" onclick="loadAlbumDetails('${album.id}')">`;
                albumsHtml += `</div>`;
                albumsHtml += '<div class="card-body">';
                albumsHtml += `<h5 class="card-title">${album.album}</h5>`;
                albumsHtml += `<p class="card-text">${album.artist} - ${album.year}</p>`;
                albumsHtml += '</div>'; // 关闭 card-body
                albumsHtml += '</div>'; // 关闭 card
                albumsHtml += '</div>'; // 关闭 col-md-2
            });
            albumsHtml += '</div>'; // 关闭 row
            $('#content').html(albumsHtml);
        } else {
            $('#content').html('<p>' + data.message + '</p>');
        }
        $('body').css({
            'background-image': `url('/cover/${randomAlbum.coverArt}')`,
            'background-size': 'cover',
            'background-position': 'center'
        });
        // 添加或移除背景模糊效果
        if ($('.blur-background').length === 0) {
            $('<div class="blur-background"></div>').appendTo('body');
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to load albums:', textStatus, errorThrown);
        $('#content').html('<p>Failed to load albums. Please try again later.</p>');
    });
}






function loadAlbumDetails(albumId) {
    $('#up-button').prop('disabled', true);
    $('#down-button').prop('disabled', true);
    console.log('Loading album details for album ID:', albumId);
    var url = '/get_album_details/' + albumId;
    $('#content').html('<p>Loading album details...</p>'); // 显示加载中信息
    history.pushState(null, '', '/albums/' + albumId); // 这里可以根据需要自定义URL路径
    $.getJSON(url, function (data) {
        //console.log(data);
        if (data.status === 'ok') {
            var album = data.album;
            var albumHtml = '<div class="row">';
            albumHtml += '<div class="col-md-3">';
            albumHtml += '<div class="card">';
            //albumHtml += `<img src="/cover/${album.coverArt}" class="card-img-top" alt="${album.name} Album Cover - TouHou Music">`;
            albumHtml += `<a href="/cover/o/${album.name}/${album.coverArt}" target="_blank">`;
            albumHtml += `<img src="/cover/${album.coverArt}" class="card-img-top" alt="${album.name} Album Cover - TouHou Music">`;
            albumHtml += `</a>`;
            albumHtml += '</div>';
            albumHtml += '</div>';
            albumHtml += '<div class="col-md-9">';
            albumHtml += '<ul class="list-group mb-3">';
            albumHtml += `<li class="list-group-item"><strong>专辑名称:</strong> <a href="/albums/${albumId}" target="_blank">${album.name}</a></li>`;
            albumHtml += `<li class="list-group-item"><strong>专辑封面:</strong> <a href="/cover/o/${album.name}/${album.coverArt}" target="_blank">点击打开</a></li>`;
            albumHtml += `<li class="list-group-item"><strong>社团名称:</strong> <span href="/artist/${album.artistId}" style="cursor: pointer; text-decoration: underline;" onclick="loadArtistDetails('${"",album.artistId}')">${album.artist}</span></li>`;
            albumHtml += `<li class="list-group-item"><strong>歌曲总数:</strong> ${album.songCount}</li>`;
            albumHtml += `<li class="list-group-item"><strong>首发日期:</strong> ${album.year}</li>`;
            albumHtml += `<li class="list-group-item"><strong>专辑总长:</strong> ${formatTime(album.duration)}</li>`;
            albumHtml += '</ul>';
            albumHtml += '</div>';
            albumHtml += '</div>'; // 结束row
            albumHtml += '<table class="table table-bordered table-striped">';
            albumHtml += '<thead class="thead-blue">';
            albumHtml += '<tr>';
            albumHtml += '<th>Track</th>';
            albumHtml += '<th>Title</th>';
            albumHtml += '<th>Artist</th>';
            albumHtml += '</tr>';
            albumHtml += '</thead>';
            albumHtml += '<tbody>';
            album.song.forEach(function (song) {
                albumHtml += `<tr style="cursor: pointer;" onclick="playSong('${song.id}', '${song.title}', '${album.coverArt}','${song.artist}')">`;
                albumHtml += `<td>${song.track}</td>`;
                albumHtml += `<td>${song.title}</td>`;
                albumHtml += `<td>${song.artist}</td>`;
                albumHtml += '</tr>';
            });
            albumHtml += '</tbody>';
            albumHtml += '</table>';
            $('#content').html(albumHtml);
            $('body').css({
                'background-image': `url('/cover/${album.coverArt}')`,
                'background-size': 'cover',
                'background-position': 'center'
            });
            // 添加或移除背景模糊效果
            if ($('.blur-background').length === 0) {
                $('<div class="blur-background"></div>').appendTo('body');
            }
            
        } else {
            $('#content').html('<p>' + data.message + '</p>');
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to load album details:', textStatus, errorThrown);
        $('#content').html('<p>Failed to load album details. Please try again later.</p>');
    });
}



function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    
    // 使用 padStart 函数来确保秒数和分钟数为两位数
    let formattedTime = `${minutes.toString().padStart(2, '0')}分${remainingSeconds.toString().padStart(2, '0')}秒`;
    
    return formattedTime;
}


