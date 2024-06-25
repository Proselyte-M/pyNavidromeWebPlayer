function loadAlbums(page) {
    console.log('Loading albums...');
    $('#content').html('<p>Loading albums...</p>'); // 显示加载中信息
    $.getJSON(`/get_albums/${page}`, function (data) {
        if (data.status === 'ok') {
            var albumsHtml = '<div class="row">';
            data.albums.forEach(function (album) {
                albumsHtml += '<div class="col-md-3">';
                albumsHtml += '<div class="card mb-4 shadow-sm">';
                
                // 使用 .card-img-top 类来确保图片正常显示
                albumsHtml += `<img class="card-img-top square-img" src="/cover/${album.coverArt}" alt="Album Cover" onclick="loadAlbumDetails('${album.id}')">`;
                
                albumsHtml += '<div class="card-body">';
                albumsHtml += `<h5 class="card-title">${album.name}</h5>`;
                albumsHtml += `<p class="card-text">${album.artist}</p>`;
                albumsHtml += '</div>'; // 关闭 card-body
                
                albumsHtml += '</div>'; // 关闭 card
                albumsHtml += '</div>'; // 关闭 col-md-3
            });
            albumsHtml += '</div>'; // 关闭 row
            $('#content').html(albumsHtml);
            history.pushState(null, '', `/albumlist/${page}`);  // 这里可以根据需要自定义URL路径

        } else {
            $('#content').html('<p>' + data.message + '</p>');
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to load albums:', textStatus, errorThrown);
        $('#content').html('<p>Failed to load albums. Please try again later.</p>');
    });
}



function loadAlbumDetails(albumId) {
    console.log('Loading album details for album ID:', albumId);
    var url = '/get_album_details/' + albumId;
    $('#content').html('<p>Loading album details...</p>'); // 显示加载中信息
    $.getJSON(url, function (data) {
        console.log(data);
        if (data.status === 'ok') {
            var album = data.album;
            var albumHtml = '<div class="row">';
            albumHtml += '<div class="col-md-3">';
            albumHtml += '<div class="card">';
            albumHtml += `<img src="/cover/${album.coverArt}" class="card-img-top" alt="Cover Art">`;
            albumHtml += '</div>';
            albumHtml += '</div>';
            albumHtml += '<div class="col-md-9">';
            albumHtml += '<ul class="list-group mb-3">';
            albumHtml += `<li class="list-group-item"><strong>Album Name:</strong> ${album.name}</li>`;
            albumHtml += `<li class="list-group-item"><strong>Album Artist:</strong> <span style="cursor: pointer; text-decoration: underline;" onclick="loadArtistDetails('${album.artistId}')">${album.artist}</span></li>`;
            albumHtml += `<li class="list-group-item"><strong>Song Count:</strong> ${album.songCount}</li>`;
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
                albumHtml += `<tr style="cursor: pointer;" onclick="playSong('${song.id}', '${song.title}', '${album.coverArt}')">`;
                albumHtml += `<td>${song.track}</td>`;
                albumHtml += `<td>${song.title}</td>`;
                albumHtml += `<td>${song.artist}</td>`;
                albumHtml += '</tr>';
            });
            albumHtml += '</tbody>';
            albumHtml += '</table>';
            $('#content').html(albumHtml);
            // 更新URL
            history.pushState(null, '', '/albums/' + albumId); // 这里可以根据需要自定义URL路径
        } else {
            $('#content').html('<p>' + data.message + '</p>');
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to load album details:', textStatus, errorThrown);
        $('#content').html('<p>Failed to load album details. Please try again later.</p>');
    });
}



function playSong(songId, songTitle, coverArt) {
    console.log(`Playing song ID: ${songId}, Title: ${songTitle}`);
    var url = `/play/${songId}`;
    var audioElement = $('#audioPlayer');
    if (audioElement.length === 0) {
        audioElement = $('<audio id="audioPlayer" controls></audio>');
        $('#content').append(audioElement);
    }
    audioElement.attr('src', url);
    audioElement[0].play();
}

