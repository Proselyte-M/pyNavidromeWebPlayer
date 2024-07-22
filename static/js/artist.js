function loadArtistDetails(artistId) {
    $('#up-button').prop('disabled', true);
    $('#down-button').prop('disabled', true);
    console.log('Loading Artist Details...');
    $('#content').html('<p>Loading artist details...</p>'); // 显示加载中信息
    // 更新URL
    history.pushState(null, '', '/artist/' + artistId);  // 这里可以根据需要自定义URL路径
    
    $.getJSON('/getArtist/' + artistId, function (data) {
        console.debug(data);
        if (data.status === 'ok') {
            var artistHtml = `
                <div>
                    <h5 class="card-title">${data.artist.name}</h5>
                </div>
                <div class="row album-list">
            `;

            data.artist.album.forEach(function (album) {
                artistHtml += `
                    <div class="${albumliststyle}">
                        <div class="card shadow-sm">
                            <div class="square-img-container">
                                <img class="card-img-top square-img" title="点击打开专辑：${album.album}" src="/newcover/${albumlistCoverSize}/${album.coverArt}" alt="${album.album} Album Cover - TouHou Music" onclick="loadAlbumDetails('${album.id}')">
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${$('<div>').text(album.name).html()}</h5>
                                <p class="card-text">${$('<div>').text(album.artist + "\t---\t" + album.year).html()}</p>
                            </div>
                        </div>
                    </div>
                `;
            });

            artistHtml += '</div>'; // 关闭 row
            $('#content').html(artistHtml);
        } else {
            showError(data.message);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to load artist details:', textStatus, errorThrown);
        showError('Failed to load artist details. Please try again later.');
    });
}

function getIndexes() {
    console.log('Loading Indexes...');
    $('#artistlist').html('<p>Loading artists list...</p>'); // 显示加载中信息
    $.getJSON('/getIndexes', function (data) {
        console.debug(data)
        if (data.status === 'ok') {
            var indexHtml = '<h3>同人社团列表</h3>';
            data.indexes.index.forEach(function (list) {
                indexHtml += `
                    <div class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${list.name}</h5>
                `;

                list.artist.forEach(function (artist) {
                    indexHtml += `<h5 class="card-title"><a href="#" onclick="loadArtistDetails('${artist.id}')">${artist.name}</a></h5>`;
                });

                indexHtml += `
                        </div>
                    </div>
                `;
            });

            $('.artistlist').html(indexHtml);
        } else {
            showError(data.message, '.artistlist');
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to load indexes:', textStatus, errorThrown);
        showError('Failed to load indexes. Please try again later.', '.artistlist');
    });
}

function showError(message, selector = '#content') {
    $(selector).html(`<p>${message}</p>`);
}

