function globalsearch(query) {
    if (query !== undefined) {
        document.getElementById("search-input-text").value = query;
    }
    const searchText = document.getElementById("search-input-text").value;
    history.pushState(null, '', `/search/${searchText}`);
    
    const sHtml = `
        <div id="search-Albums" class="collapsible" aria-expanded="false">
            搜索专辑
        </div>
        <hr>
        <div id="search-Artists" class="collapsible" aria-expanded="false">
            搜索艺术家
        </div>
        <hr>
        <div id="search-Songs" class="collapsible" aria-expanded="false">
            搜索歌曲
        </div>
    `;
    $('#content').html(sHtml);

    search('albums', searchText);
    search('artists', searchText);
    search('songs', searchText);
}

function search(type, query) {
    const searchSelectors = {
        'albums': '#search-Albums',
        'artists': '#search-Artists',
        'songs': '#search-Songs'
    };

    $(searchSelectors[type]).html('<p>Searching...</p>');

    const endpoints = {
        'albums': '/search',
        'artists': '/search_artists',
        'songs': '/search_songs'
    };

    $.getJSON(endpoints[type], { query: query }, function (data) {
        if (data.status === 'ok') {
            let htmlContent = generateHtmlContent(type, data);
            $(searchSelectors[type]).html(htmlContent);
        } else {
            showError(data.message, searchSelectors[type]);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error(`Failed to search ${type}:`, textStatus, errorThrown);
        showError(`Failed to search ${type}. Please try again later.`, searchSelectors[type]);
    });
}

function generateHtmlContent(type, data) {
    let htmlContent = '';

    if (type === 'albums') {
        if (data.albums.length > 0) {
            htmlContent = '<div class="row album-list"><ul class="list-group"><li class="list-group-item"><h5>专辑：</h5></li></ul>';
            data.albums.forEach(album => {
                htmlContent += `
                    <div class="col-lg-2 col-md-3 col-sm-6 col-12 mb-4 hvr-grow">
                        <div class="card shadow-sm">
                            <div class="square-img-container">
                                <img class="card-img-top square-img" title="点击打开专辑：${album.album}" src="/newcover/${albumlistCoverSize}/${album.coverArt}" alt="${album.album} Album Cover - TouHou Music" onclick="loadAlbumDetails('${album.id}')">
                                <button class="playalbumbutton" title="点击播放专辑：${album.album}" onclick="playAlbum('${album.id}')">▶</button>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title" title="${album.album}">${album.album}</h5>
                                <p class="card-text" title="${album.artist} - ${album.year}">${album.artist} - ${album.year}</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            htmlContent += '</div>';
        } else {
            htmlContent = '<ul class="list-group"><li class="list-group-item"><h5>没有找到专辑。</h5></li></ul>';
        }
    } else if (type === 'artists') {
        if (data.artists.length > 0) {
            htmlContent = '<ul class="list-group"><li class="list-group-item"><h5>艺术家：</h5></li>';
            data.artists.forEach(artist => {
                htmlContent += `<a href="javascript:void(0);" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center hvr-glow" onclick="loadArtistDetails('${artist.id}')"><h5>${artist.name}</h5></a>`;
            });
            htmlContent += '</ul>';
        } else {
            htmlContent = '<ul class="list-group"><li class="list-group-item"><h5>没有找到艺术家。</h5></li></ul>';
        }
    } else if (type === 'songs') {
        if (data.songs.length > 0) {
            htmlContent = '<div class="list-group"><li class="list-group-item"><h5>歌曲：</h5></li>';
            data.songs.forEach(song => {
                htmlContent += `
                    <a href="javascript:void(0);" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center hvr-glow" onclick="playSong('${song.id}', '${song.title}', '${song.coverArt}', '${song.artist}')">
                        <div class="d-flex align-items-center">
                            <img src="/newcover/${playerCoverSize}/${song.coverArt}" alt="${song.artist} Album Cover - TouHou Music" class="img-thumbnail mr-3" style="width: 60px; height: 60px;">
                            <div class="song-info">
                                <h5 class="mb-1">${song.track}. ${song.title}</h5>
                                <p class="mb-1">${song.artist}</p>
                            </div>
                        </div>
                        <button type="button" class="btn btn-sm btn-primary" onclick="event.stopPropagation(); loadAlbumDetails('${song.albumId}')">打开专辑</button>
                    </a>
                `;
            });
            htmlContent += '</div>';
        } else {
            htmlContent = '<ul class="list-group"><li class="list-group-item"><h5>没有找到歌曲。</h5></li></ul>';
        }
    }

    return htmlContent;
}

function showError(message, selector) {
    $(selector).html(`<p>${message}</p>`);
}
