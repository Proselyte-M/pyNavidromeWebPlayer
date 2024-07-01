function loadArtistDetails(artistId) {
    $('#up-button').prop('disabled', true);
    $('#down-button').prop('disabled', true);
    console.log('Loading Artist Details...');
    $('#content').html('<p>Loading artist details...</p>'); // 显示加载中信息
    // 更新URL
    history.pushState(null, '', '/artist/' + artistId);  // 这里可以根据需要自定义URL路径
    $.getJSON('/getArtist/' + artistId, function (data) {
        console.log(data);
        if (data.status === 'ok') {
            var albumsHtml = ""
            albumsHtml += `<div>`
            albumsHtml += `<h5 class="card-title">${data.artist.name}</h5>`
            albumsHtml += `</div>`
            albumsHtml += '<div class="row">';
            data.artist.album.forEach(function (album) {
                albumsHtml += '<div class="col-md-2 mb-4">';
                albumsHtml += '<div class="card mb-4 shadow-sm">';
                albumsHtml += `<div class="square-img-container">`;
                // 使用 .card-img-top 类确保图片正常显示
                albumsHtml += `<img class="card-img-top square-img" src="/cover/${album.coverArt}" alt="Album Cover" onclick="loadAlbumDetails('${album.id}')">`;
                albumsHtml += `</div>`;
                albumsHtml += '<div class="card-body">';
                albumsHtml += `<h5 class="card-title">${$('<div>').text(album.name).html()}</h5>`;
                albumsHtml += `<p class="card-text">${$('<div>').text(album.artist+"\t---\t"+album.year).html()}</p>`;
                albumsHtml += '</div>'; // 关闭 card-body
                albumsHtml += '</div>'; // 关闭 card
                albumsHtml += '</div>'; // 关闭 col-md-3
            });
            albumsHtml += '</div>'; // 关闭 row
            $('#content').html(albumsHtml);
            // 获取相册数量
            var albumCount = data.artist.album.length;
            // 随机选择一个封面索引
            var randomIndex = Math.floor(Math.random() * albumCount);
            var randomAlbum = data.artist.album[randomIndex];
            $('body').css({
                'background-image': `url('/cover/${randomAlbum.coverArt}')`,
                'background-size': 'cover',
                'background-position': 'center'
            });
            // 添加或移除背景模糊效果
            if ($('.blur-background').length === 0) {
                $('<div class="blur-background"></div>').appendTo('body');
            }
            
        } else {
            $('#content').html('<p>' + $('<div>').text(data.message).html() + '</p>');
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to load artist details:', textStatus, errorThrown);
        $('#content').html('<p>Failed to load artist details. Please try again later.</p>');
    });
}


function getIndexes() {
    console.log('Loading Indexes...');
    $('#artistlist').html('<p>Loading artists list...</p>'); // 显示加载中信息
    $.getJSON('/getIndexes', function (data) {
        if (data.status === 'ok') {
            var artistsHtml = ''; // 确保在这里定义 artistsHtml 变量
            //console.log(data.indexes.index);
            artistsHtml +="<h3>同人社团列表</h3>"
            data.indexes.index.forEach(function (list) {
                artistsHtml += '<div class="card mb-4 shadow-sm">';
                artistsHtml += '<div class="card-body">';
                artistsHtml += `<h5 class="card-title">${list.name}</h5>`;
                list.artist.forEach(function (artist) { // 修正 artists 为 artist
                    artistsHtml += `<h5 class="card-title"><a href="#" onclick="loadArtistDetails('${artist.id}')">${artist.name}</a></h5>`;
                });
                artistsHtml += '</div>';
                artistsHtml += '</div>';
            });
            // 更新 .artistlist 内容
            $('.artistlist').html(artistsHtml);
        } else {
            $('.artistlist').html('<p>' + data.message + '</p>'); // 修正选择器
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to load indexes:', textStatus, errorThrown);
        $('.artistlist').html('<p>Failed to load indexes. Please try again later.</p>'); // 修正选择器
    });
}

// 页面加载完毕后调用 getIndexes 函数
$(document).ready(function () {
    getIndexes();
});