$(document).ready(function () {
    populateGenresDropdown('/getGenres', 'dynamic-select');
});

function populateGenresDropdown(url, selectId) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const genres = data.genres.genre;
            const select = document.getElementById(selectId);

            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.value;
                option.textContent = `${genre.value} (${genre.albumCount} albums, ${genre.songCount} songs)`;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Fetch请求失败:', error));
}

function loadAlbumsByGenres(genres, page) {
    console.info('Loading albums list...');
    $('#content').html('<p>Loading albums...</p>'); // 显示加载中信息
    // history.pushState(null, '', `/albumlist/${page}`);  // 这里可以根据需要自定义URL路径

    $.getJSON(`/getSongsByGenre/${genres}/${page}`, function (data) {
        console.debug(data);
        if (data.status === 'ok') {
            var genresHtml = `
                <div>
                    <h5 class="card-title">音乐风格：${genres}，第${page}页</h5>
                </div>
                <div class="row">
            `;

            data.GenreList.forEach(function (album) {
                genresHtml += `
                    <div class="${albumliststyle}">
                        <div class="card shadow-sm">
                            <div class="square-img-container">
                                <img class="card-img-top square-img" src="/newcover/${albumlistCoverSize}/${album.coverArt}" alt="${album.album} Album Cover - TouHou Music" onclick="loadAlbumDetails('${album.albumId}')">
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${album.album}</h5>
                                <p class="card-text">${album.artist} - ${album.year}</p>
                            </div>
                        </div>
                    </div>
                `;
            });

            genresHtml += '</div>'; // 关闭 row
            $('#content').html(genresHtml);
        } else {
            showError(data.message);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to load albums:', textStatus, errorThrown);
        showError('Failed to load albums. Please try again later.');
    });
}

function showError(message, selector = '#content') {
    $(selector).html(`<p>${message}</p>`);
}

// 获取下拉选单元素并添加 change 事件监听器
document.getElementById('dynamic-select').addEventListener('change', function() {
    const selectedValue = this.value;
    loadAlbumsByGenres(selectedValue, 0);
    console.log('选择的值是:', selectedValue);
});
