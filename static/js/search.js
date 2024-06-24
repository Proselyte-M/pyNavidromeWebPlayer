function searchAlbums(query) {
    $.getJSON('/search', { query: query }, function (data) {
        console.log(data);
        if (data.status === 'ok') {
            var albumsHtml = '<div class="row">';
            data.albums.forEach(function (album) {
                albumsHtml += '<div class="col-md-3">';
                albumsHtml += '<div class="card mb-4 shadow-sm">';
                albumsHtml += `<img src="/cover/${album.coverArt}" class="card-img-top" alt="Album Cover">`;
                albumsHtml += '<div class="card-body">';
                albumsHtml += `<h5 class="card-title">${album.name}</h5>`;
                albumsHtml += `<p class="card-text">${album.artist}</p>`;
                albumsHtml += `<button class="btn btn-primary" onclick="loadAlbumDetails('${album.id}')">View Album</button>`;
                albumsHtml += '</div>';
                albumsHtml += '</div>';
                albumsHtml += '</div>';
            });
            albumsHtml += '</div>';
            $('#content').html(albumsHtml);
        } else {
            $('#content').html('<p>' + data.message + '</p>');
        }
    });
}

function searchArtists(query) {
    $.getJSON('/search_artists', { query: query }, function (data) {
        console.log(data);
        if (data.status === 'ok') {
            var artistsHtml = '<div class="row">';
            data.artists.forEach(function (artist) {
                artistsHtml += '<div class="col-md-3">';
                artistsHtml += '<div class="card mb-4 shadow-sm">';
                artistsHtml += '<div class="card-body">';
                artistsHtml += `<h5 class="card-title">${artist.name}</h5>`;
                artistsHtml += `<button class="btn btn-primary" onclick="loadArtistDetails('${artist.id}')">View Artist</button>`;
                artistsHtml += '</div>';
                artistsHtml += '</div>';
                artistsHtml += '</div>';
            });
            artistsHtml += '</div>';
            $('#content').html(artistsHtml);
        } else {
            $('#content').html('<p>' + data.message + '</p>');
        }
    });
}

function searchSongs(query) {
    $.getJSON('/search_songs', { query: query }, function (data) {
        console.log(data);
        if (data.status === 'ok') {
            var songsHtml = '<div class="row">';
            data.songs.forEach(function (song) {
                songsHtml += '<div class="col-md-3">';
                songsHtml += '<div class="card mb-4 shadow-sm">';
                songsHtml += '<div class="card-body">';
                songsHtml += `<img src="/cover/${song.coverArt}" class="card-img-top" alt="Album Cover">`;
                songsHtml += `<h5 class="card-title">${song.track}.${song.title}</h5>`;
                songsHtml += `<p class="card-text">${song.artist}</p>`;
                songsHtml += `<button class="btn btn-primary" onclick="playSong('${song.id}', '${song.title}', '${song.albumId}')">Play Song</button>`;
                songsHtml += `<button class="btn btn-primary" onclick="loadAlbumDetails('${song.albumId}')">View Album</button>`;
                songsHtml += '</div>';
                songsHtml += '</div>';
                songsHtml += '</div>';
            });
            songsHtml += '</div>';
            $('#content').html(songsHtml);
        } else {
            $('#content').html('<p>' + data.message + '</p>');
        }
    });
}
