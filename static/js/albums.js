

function loadAlbums(page) {
    updateButtonState(false);
    console.info('Loading albums list...');
    showLoadingMessage('Loading albums...');

    history.pushState(null, '', `/albumlist/${page}`);  // 自定义URL路径

    $.getJSON(`/get_albums/${page}`, function (data) {
        if (data.status === 'ok') {
            $('#content').html(generateAlbumsHtml(data.albums, page));
        } else {
            showError(data.message);
        }
    }).fail(handleAjaxFail('albums'));
}

function loadAlbumDetails(albumId) {
    updateButtonState(true);
    console.info('Loading album details for album ID:', albumId);
    var url = '/get_album_details/' + albumId;
    showLoadingMessage('Loading album details...');

    history.pushState(null, '', '/albums/' + albumId);  // 自定义URL路径

    $.getJSON(url, function (data) {
        if (data.status === 'ok') {
            $('#content').html(generateAlbumDetailsHtml(data.album));
            fetchAndUpdateAlbumInfo(data);
            updateButton(albumId);
        } else {
            showError(data.message);
        }
    }).fail(handleAjaxFail('album details'));
}

function fetchAndUpdateAlbumInfo(data) {
    var album = data.album;
    var url = `/getWikiAlbumInfo/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.name)}`;

    $.ajax({
        url: url,
        dataType: 'json',
        success: function (wikidata) {
            if (wikidata && wikidata.album_info && wikidata.album_info.length > 1) {
                $('#content').html(generateWikiAlbumHtml(album, wikidata.album_info));
                updateButton(album.id);
            }
        }
    });
}

function displayFavoriteAlbums() {
    const albumIds = getFavoriteAlbumsArray();
    const contentDiv = $('#content');
    contentDiv.empty();
    history.pushState(null, '', `/displayFavoriteAlbums`);  // 自定义URL路径

    // 添加一个row类外部包装
    const rowDiv = $('<div class="row"></div>');
    contentDiv.append(rowDiv);
    textDiv = `
    <button class="hvr-outline-out" onclick="showCookieBash64()">导出收藏专辑列表</button>
    <button class="hvr-outline-in" onclick="importFavorites()">导入收藏专辑列表</button>
    <div id="textboxout" class="textbox-container" style="display: none;">
        <textarea id="generatedTextout" rows="10" cols="50" readonly></textarea>
    </div>
    <div id="textboxin" class="textbox-container" style="display: none;">
        <textarea id="generatedTextin" rows="10" cols="50"></textarea>
        <button id="textboxbuttonin"onclick="submitFavorites()" style="display: none;">确定</button>
    </div>
    `
    contentDiv.append(textDiv);

    albumIds.forEach(albumId => {
        $.ajax({
            url: '/get_album_details/' + albumId,
            method: 'GET',
            success: function (album) {
                console.debug(album)
                album = album.album;
                const albumHtml = `
                    <div class="col-lg-2 col-md-3 col-sm-6 col-12 mb-4 hvr-grow">
                        <div class="card shadow-sm">
                            <div class="square-img-container">
                                <img class="card-img-top square-img" title="点击打开专辑：${album.name}" src="/newcover/${albumlistCoverSize}/${album.coverArt}" alt="${album.name} Album Cover - TouHou Music" onclick="loadAlbumDetails('${album.id}')">
                                <button class="playalbumbutton" title="点击播放专辑：${album.album}" onclick="playAlbum('${album.id}')">▶</button>
                            </div>
                            <frosted-glass>
                            <div class="card-body">
                                <h5 class="card-title" title="${album.name}">${album.name}</h5>
                                <p class="card-text" title="${album.artist} - ${album.year}">${album.artist} - ${album.year}</p>
                            </div>
                            </frosted-glass>
                        </div>
                    </div>
                   
                `;
                // 将卡片添加到rowDiv中
                rowDiv.append(albumHtml);
            },
            error: function () {
                console.error(`无法获取专辑ID为${albumId}的专辑详情。`);
            }
        });
    });
}



function generateAlbumsHtml(albums, page) {
    let albumsHtml = `
        <div>
            <h5 class="card-title">最新音乐-第${page}页</h5>
        </div>
        <div class="row album-list">
    `;
    albums.forEach(function (album) {
        albumsHtml += `
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
    albumsHtml += '</div>'; // 关闭 row
    return albumsHtml;
}


function generateAlbumDetailsHtml(album) {
    let detailsHtml = `
    <div class="row">
        <div class="col-md-3">
            <div class="card">
                <a href="/newcover/2000/${album.coverArt}" target="_blank">
                    <img src="/newcover/${albumdtlCoverSize}/${album.coverArt}" class="card-img-top hvr-grow" alt="${album.name} Album Cover - TouHou Music">
                </a>
            </div>
        </div>
        <div class="col-md-9">
<ul class="list-group mb-3 albuminfo">
    <li class="list-group-item"><strong>专辑名称:</strong> <a href="/albums/${album.id}" target="_blank">${album.name}</a></li>
    <li class="list-group-item"><strong>专辑封面:</strong> <a href="/newcover/2000/${album.coverArt}" target="_blank">点击打开</a></li>
    <li class="list-group-item"><strong>社团名称:</strong> <span href="/artist/${album.artistId}" style="cursor: pointer; text-decoration: underline;" onclick="loadArtistDetails('${album.artistId}')">${album.artist}</span></li>
    <li class="list-group-item"><strong>歌曲总数:</strong> ${album.songCount}</li>
    <li class="list-group-item"><strong>首发日期:</strong> ${album.year}</li>
    <li class="list-group-item play-album"><strong>专辑时长:</strong> ${formatTime(album.duration)}-<button class="hvr-underline-from-left" id="playalbum" onclick="playAlbum('${album.id}')">▶播放专辑</li>
    <li class="list-group-item"><button class="hvr-rectangle-out" id="saveFavoriteBtn" data-album-id="${album.id}">添加到收藏</li>
</ul>
        </div>
    </div>
    <div id="songlist-container">
            <div class="song-header">
            <div class="song-track">序号</div>
            <div class="song-title">歌曲名称</div>
            <div class="song-artist">艺术家</div>
        </div>
`;
    album.song.forEach(function (song) {
        detailsHtml += `
        <div id="song-item" class="song-item ${songlisteffcsion}" style="cursor: pointer;" onclick="playSong('${song.id}', '${song.title}', '${album.coverArt}', '${song.artist}')">
            <div class="song-track">${song.track}</div>
            <div class="song-title">${song.title}</div>
            <div class="song-artist">${song.artist}</div>
        </div>
    `;
    });
    detailsHtml += `
    </div>
    <div id="wiki-album-info"></div>
`;
    return detailsHtml;
}

function generateWikiAlbumHtml(album, albumData) {
    let albumHtml = `
    <div class="row">
        <div class="col-md-3">
            <div class="card">
                <a href="/newcover/2000/${album.coverArt}" target="_blank">
                    <img src="/newcover/${albumdtlCoverSize}/${album.coverArt}" class="card-img-top hvr-grow" alt="${album.name} Album Cover - TouHou Music">
                </a>
            </div>
        </div>
        <div class="col-md-9">
            <ul class="list-group mb-3 albuminfo">
                <li class="list-group-item"><strong>专辑名称:</strong> <a href="/albums/${album.id}" target="_blank">${albumData[0].alname}</a>（以下专辑信息皆获取自ThWiki）<a href=https://thwiki.cc/${replaceSpacesWithUnderscores(albumData[0].alname)} target="_blank">点击打开Wiki界面</a></li>
                <li class="list-group-item"><strong>专辑封面:</strong> <a href="${albumData[0].coverurl}" target="_blank">点击打开</a><br><strong> 封面角色:</strong> ${albumData[0].coverchar}</li>
                <li class="list-group-item"><strong>社团名称:</strong> <span href="/artist/${albumData[0].circle}" style="cursor: pointer; text-decoration: underline;" onclick="loadArtistDetails('${album.artistId}')">${album.artist}</span></li>
                <li class="list-group-item"><strong>歌曲总数:</strong> ${album.songCount}</li>
                <li class="list-group-item"><strong>首发日期:</strong> ${albumData[0].date}<br><strong>发布展会:</strong> ${albumData[0].event}</li>
                <li class="list-group-item play-album"><strong>专辑时长:</strong> ${formatTime(album.duration)}-<button class="hvr-underline-from-left" id="playalbum" onclick="playAlbum('${album.id}')">▶播放专辑</li>
                <li class="list-group-item"><button class="hvr-rectangle-out" id="saveFavoriteBtn" data-album-id="${album.id}">添加到收藏</button></li>
            </ul>
        </div>
    </div>
    <div id="songlist-container">
        <div class="song-header">
            <div class="song-track">序号</div>
            <div class="song-title">歌曲名称</div>
            <div class="song-artist">艺术家</div>
            <div class="song-ogmusic">原曲</div>
        </div>
`;

    var songLength = album.song.length;
    var albumDataLength = Object.keys(albumData[1]).length;
    var minLength = Math.min(songLength, albumDataLength);

    for (var i = 0; i < minLength; i++) {
        var song = album.song[i];
        var key = Object.keys(albumData[1])[i];
        var trackData = albumData[1][key];

        var artistText = "";
        if (trackData.arrange) artistText += `编曲：${trackData.arrange}<br>`;
        if (trackData.vocal) artistText += `演唱：${trackData.vocal}<br>`;
        if (trackData.compose) artistText += `作曲：${trackData.compose}<br>`;
        if (trackData.dub) artistText += `配音：${trackData.dub}<br>`;
        if (trackData.lyric) artistText += `作词：${trackData.lyric}<br>`;
        if (trackData.script) artistText += `剧本：${trackData.script}<br>`;
        if (trackData.perform) artistText += `演奏：${trackData.perform}<br>`;

        albumHtml += `
        <div id="song-item" class="song-item ${songlisteffcsion}" style="cursor: pointer;" onclick="playSong('${song.id}', '${song.title}', '${album.coverArt}', '${song.artist}')">
            <div class="song-track">${trackData.trackno}</div>
            <div class="song-title">${trackData.name}</div>
            <div class="song-artist">${artistText}</div>
            <div class="song-ogmusic">${trackData.ogmusic}</div>
        </div>
    `;
    }

    // 处理剩余的 album.song
    for (var i = minLength; i < songLength; i++) {
        var song = album.song[i];
        albumHtml += `
        <div id="song-item" class="song-item ${songlisteffcsion}" style="cursor: pointer;" onclick="playSong('${song.id}', '${song.title}', '${album.coverArt}', '${song.artist}')">
            <div class="song-track">${song.track}</div>
            <div class="song-title">${song.title}</div>
            <div class="song-artist">${song.artist}</div>
            <div class="song-ogmusic"></div>
        </div>
    `;
    }

    // 处理剩余的 albumData[1]
    for (var i = minLength; i < albumDataLength; i++) {
        var key = Object.keys(albumData[1])[i];
        var trackData = albumData[1][key];
        albumHtml += `
        <div id="song-item" class="song-item ${songlisteffcsion}">
            <div class="song-track">${trackData.trackno}</div>
            <div class="song-title">${trackData.name}</div>
            <div class="song-artist">${trackData.artist}</div>
            <div class="song-ogmusic">${trackData.ogmusic}</div>
        </div>
    `;
    }

    albumHtml += `
    </div>
`;
    return albumHtml;

}

function updateButtonState(disabled) {
    $('#up-button').prop('disabled', disabled);
    $('#down-button').prop('disabled', disabled);
}

function showLoadingMessage(message) {
    $('#content').html(`<p>${message}</p>`);
}

function handleAjaxFail(context) {
    return function (jqXHR, textStatus, errorThrown) {
        console.error(`Failed to load ${context}:`, textStatus, errorThrown);
        showError(`Failed to load ${context}. Please try again later.`);
    };
}

function replaceSpacesWithUnderscores(input) {
    return encodeURIComponent(input);
}

function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}分${remainingSeconds.toString().padStart(2, '0')}秒`;
}

function showError(message) {
    $('#content').html(`<p>${message}</p>`);
}

function showCookieBash64() {
    var textboxin = document.getElementById('textboxin');
    textboxin.style.display = 'none'; // 显示文本框
    var textboxbuttonin = document.getElementById('textboxbuttonin');
    textboxbuttonin.style.display = 'none';
    var generatedText = exportFavoriteAlbumsBase64(); // 调用生成文字的方法
    var textboxout = document.getElementById('textboxout');
    var textarea = document.getElementById('generatedTextout');
    textarea.value = generatedText; // 将生成的文字放入文本框中
    textboxout.style.display = 'block'; // 显示文本框
}

function importFavorites() {
    var textbox = document.getElementById('textboxout');
    textbox.style.display = 'none';
    var textboxbuttonin = document.getElementById('textboxbuttonin');
    var textbox = document.getElementById('textboxin');
    textbox.style.display = 'block'; // 显示文本框
    textboxbuttonin.style.display = 'block';
}

function submitFavorites() {

    var textarea = document.getElementById('generatedTextin');
    var importText = textarea.value;
    importFavoriteAlbumsBase64(importText)
    console.log("导入的收藏专辑列表:", importText);
}