function fetchAndUpdateAlbumInfo(data) {
    console.debug(data);
    var album = data.album;
    var artist_s = album.artist;
    var album_s = album.name;
    var url = '/getWikiAlbumInfo/' + encodeURIComponent(artist_s) + '/' + encodeURIComponent(album_s);
    $.ajax({
        url: url,
        dataType: 'json',
        success: function (wikidata) {
            if (wikidata && wikidata.album_info && wikidata.album_info.length > 1) {
                console.debug(wikidata);
                
                let albumData = wikidata.album_info;
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
                albumHtml += `<li class="list-group-item"><strong>专辑名称:</strong> <a href="/albums/${album.id}" target="_blank">${albumData[0].alname}</a>（以下专辑信息皆获取自ThWiki）<a href=https://thwiki.cc/${replaceSpacesWithUnderscores(albumData[0].alname)} target="_blank">点击打开Wiki界面</a></li>`;
                albumHtml += `<li class="list-group-item"><strong>专辑封面:</strong> <a href="/cover/o/${album.name}/${album.coverArt}" target="_blank">点击打开</a><br><strong> 封面角色:</strong> ${albumData[0].coverchar}</li>`;
                albumHtml += `<li class="list-group-item"><strong>社团名称:</strong> <span href="/artist/${albumData[0].circle}" style="cursor: pointer; text-decoration: underline;" onclick="loadArtistDetails('${"", album.artistId}')">${album.artist}</span></li>`;
                albumHtml += `<li class="list-group-item"><strong>歌曲总数:</strong> ${album.songCount}</li>`;
                albumHtml += `<li class="list-group-item"><strong>首发日期:</strong> ${albumData[0].date}<br><strong>发布展会:</strong> ${albumData[0].event}</li>`;
                albumHtml += `<li class="list-group-item play-album" onclick="playAlbum('${album.id}')"><strong>播放专辑:</strong> ▶总长${formatTime(album.duration)}</li>`;
                albumHtml += '</ul>';
                albumHtml += '</div>';
                albumHtml += '</div>'; // 结束row
                albumHtml += '<table id="songlist-table" class="table table-bordered table-striped">';
                albumHtml += '<thead class="thead-blue">';
                albumHtml += '<tr>';
                albumHtml += '<th>Track</th>';
                albumHtml += '<th>Title</th>';
                albumHtml += '<th>Artist</th>';
                albumHtml += '<th>ogmusic</th>';
                albumHtml += '</tr>';
                albumHtml += '</thead>';
                albumHtml += '<tbody>';
                // 获取 album.song 和 albumData[1] 的长度
                var songLength = album.song.length;
                var albumDataLength = Object.keys(albumData[1]).length;
                var minLength = Math.min(songLength, albumDataLength);
                for (var i = 0; i < minLength; i++) {
                    // 功能1
                    var song = album.song[i];
                    albumHtml += `<tr style="cursor: pointer;" onclick="playSong('${song.id}', '${song.title}', '${album.coverArt}', '${song.artist}')">`;

                    // 功能2
                    var key = Object.keys(albumData[1])[i];
                    var trackData = albumData[1][key];
                    albumHtml += `<td>${trackData.trackno}</td>`;
                    albumHtml += `<td>${trackData.name}</td>`;
                    albumHtml += `<td>${trackData.artist}</td>`;
                    albumHtml += `<td>${trackData.ogmusic}</td>`;
                    albumHtml += '</tr>';
                }

                // 如果 album.song 比 albumData[1] 长，处理剩余的 album.song
                for (var i = minLength; i < songLength; i++) {
                    var song = album.song[i];
                    albumHtml += `<tr style="cursor: pointer;" onclick="playSong('${song.id}', '${song.title}', '${album.coverArt}', '${song.artist}')">`;
                    albumHtml += '</tr>';
                }

                // 如果 albumData[1] 比 album.song 长，处理剩余的 albumData[1]
                for (var i = minLength; i < albumDataLength; i++) {
                    var key = Object.keys(albumData[1])[i];
                    var trackData = albumData[1][key];
                    albumHtml += `<tr>`;
                    albumHtml += `<td>${trackData.trackno}</td>`;
                    albumHtml += `<td>${trackData.name}</td>`;
                    albumHtml += `<td>${trackData.artist}</td>`;
                    albumHtml += `<td>${trackData.ogmusic}</td>`;
                    albumHtml += '</tr>';
                }

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
                //fetchAndDisplayAlbumInfo(album.artist, album.name);
            }
        }
    });
}








function fetchAndDisplayAlbumInfo(artist, album) {
    var url = '/getWikiAlbumInfo/' + encodeURIComponent(artist) + '/' + encodeURIComponent(album);
    // 清空 #wiki-album-info 块
    var albumInfoElement = $('#wiki-album-info');
    albumInfoElement.empty();

    $.ajax({
        url: url,
        dataType: 'json',
        success: function (data) {


            // 检查返回的JSON数据是否正确
            if (data && data.album_info && data.album_info.length > 1) {
                console.debug(data);
                let albumHtml = '';
                let albumData = data.album_info;

                // 专辑信息部分
                albumHtml += '<div class="col-md">';
                albumHtml += '<table class="table table-bordered table-striped">';
                albumHtml += '<thead class="thead-blue">';
                albumHtml += '<h5>来自Thwiki的专辑信息</h5>';
                albumHtml += '<ul class="list-group mb-3">';
                albumHtml += `<li class="list-group-item"><strong>专辑名称:</strong> <a href=https://thwiki.cc/${replaceSpacesWithUnderscores(albumData[0].alname)} target="_blank">${albumData[0].alname}</a></li>`;
                albumHtml += `<li class="list-group-item"><strong>专辑封面:</strong> <a href="${albumData[0].coverurl}" target="_blank">点击打开</a></li>`;
                albumHtml += `<li class="list-group-item"><strong>封面角色:</strong> ${albumData[0].coverchar}</li>`;
                albumHtml += `<li class="list-group-item"><strong>社团名称:</strong> <a href=https://thwiki.cc/${replaceSpacesWithUnderscores(albumData[0].circle)} target="_blank">${albumData[0].circle}</a></li>`;
                albumHtml += `<li class="list-group-item"><strong>首发日期:</strong> ${albumData[0].date}</li>`;
                albumHtml += `<li class="list-group-item"><strong>发布展会:</strong> ${albumData[0].event}</li>`;
                albumHtml += '</ul>';
                albumHtml += '</thead>';
                albumHtml += '</table>';
                albumHtml += '</div>';

                // 歌曲列表部分
                albumHtml += '<div class="col-md">';
                albumHtml += '<table class="table table-bordered table-striped">';
                albumHtml += '<thead class="thead-blue">';
                albumHtml += '<tr>';
                albumHtml += '<th>Track</th>';
                albumHtml += '<th>Title</th>';
                albumHtml += '<th>Artist</th>';
                albumHtml += '<th>ogmusic</th>';
                albumHtml += '</tr>';
                albumHtml += '</thead>';
                albumHtml += '<tbody>';

                for (var key in albumData[1]) {
                    albumHtml += '<tr>';
                    albumHtml += `<td>${albumData[1][key].trackno}</td>`;
                    albumHtml += `<td>${albumData[1][key].name}</td>`;
                    albumHtml += `<td>${albumData[1][key].artist}</td>`;
                    albumHtml += `<td>${albumData[1][key].ogmusic}</td>`;
                    albumHtml += '</tr>';
                }

                albumHtml += '</tbody>';
                albumHtml += '</table>';
                albumHtml += '</div>';

                // 将生成的HTML添加到页面中
                albumInfoElement.html(albumHtml);
            } else {
                console.error('Error: Invalid JSON data format');
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error fetching album info:', textStatus, errorThrown);
        }
    });
}

function replaceSpacesWithUnderscores(input) {
    // 将所有的空格替换为下划线
    let str = input.replace(/ /g, '_');
    // 对字符串进行URL编码
    str = encodeURIComponent(str);
    return str;
}