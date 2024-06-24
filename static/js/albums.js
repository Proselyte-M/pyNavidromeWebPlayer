function loadAlbums() {
    console.log('Loading albums...');
    $('#content').html('<p>Loading albums...</p>'); // 显示加载中信息
    $.getJSON('/get_albums', function (data) {
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
            var albumHtml = `<h1>${album.name}</h1>`;
            albumHtml += `<p>Artist: <span style="cursor: pointer; text-decoration: underline;" onclick="loadArtistDetails('${album.artistId}')('${album.artist}')">${album.artist}</span></p>`;
            albumHtml += `<img src="/cover/${album.coverArt}" class="img-fluid mb-4" alt="Album Cover">`;
            albumHtml += '<div class="list-group">';
            album.song.forEach(function (song) {
                albumHtml += `<button class="list-group-item list-group-item-action" onclick="playSong('${song.id}', '${song.title}', '${album.coverArt}')">${song.track}. ${song.title}</button>`;
            });
            albumHtml += '</div>';
            albumHtml += '<button class="btn btn-secondary mt-3" onclick="loadAlbums()">Back to Albums</button>';
            $('#content').html(albumHtml);
        } else {
            $('#content').html('<p>' + data.message + '</p>');
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
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
