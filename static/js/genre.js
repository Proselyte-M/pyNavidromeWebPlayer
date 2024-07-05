$(document).ready(function () {
    populateGenresDropdown('/getGenres', 'dynamic-select');
});
// 获取下拉选单元素
const Genresselect = document.getElementById('dynamic-select');

// 添加change事件监听器
Genresselect.addEventListener('change', function() {
    // 获取当前选择的值
    const selectedValue = Genresselect.value;
    
    // 在控制台打印选择的值（或执行其他操作）
    loadAlbumsByGenres(selectedValue,0)
    console.log('选择的值是:', selectedValue);
    
    // 这里可以根据需要执行其他操作，比如根据选择的值更新页面内容等
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

function loadAlbumsByGenres(genres,page) {
    console.info('loadAlbumsByGenres list...');
    $('#content').html('<p>Loading albums...</p>'); // 显示加载中信息
    //history.pushState(null, '', `/albumlist/${page}`);  // 这里可以根据需要自定义URL路径
    $.getJSON(`/getSongsByGenre/${genres}/${page}`, function (data) {
        console.debug(data);
        if (data.status === 'ok') { 
            var albumsHtml = "";
            albumsHtml += `<div>`;
            albumsHtml += `<h5 class="card-title">音乐风格：${genres}，第${page}页</h5>`;
            albumsHtml += `</div>`;
            albumsHtml += '<div class="row">';
            
            // 获取相册数量
            //var albumCount = data.albums.length;
            // 随机选择一个封面索引
            //var randomIndex = Math.floor(Math.random() * albumCount);
            //var randomAlbum = data.albums[randomIndex];
            
            // 设置背景图片
            data.GenreList.forEach(function (album) {
                albumsHtml += '<div class="col-md-2 col-2 mb-4">'; // 调整为col-md-2
                albumsHtml += '<div class="card shadow-sm">';
                albumsHtml += `<div class="square-img-container">`;
                
                // 使用 .card-img-top 类来确保图片正常显示
                albumsHtml += `<img class="card-img-top square-img" src="/cover/${album.coverArt}" alt="${album.album} Album Cover - TouHou Music" onclick="loadAlbumDetails('${album.albumId}')">`;
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
        //$('body').css({
        //    'background-image': `url('/cover/${randomAlbum.coverArt}')`,
        //    'background-size': 'cover',
        //    'background-position': 'center'
        //});
        // 添加或移除背景模糊效果
        //if ($('.blur-background').length === 0) {
        //    $('<div class="blur-background"></div>').appendTo('body');
        //}
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to load albums:', textStatus, errorThrown);
        $('#content').html('<p>Failed to load albums. Please try again later.</p>');
    });
}