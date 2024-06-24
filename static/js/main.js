$(document).ready(function () {
    // 初始化加载专辑
    loadAlbums();

    // 搜索功能
    $('#search-album-input').on('keyup', function () {
        var query = $(this).val();
        if (query.length > 2) {
            searchAlbums(query);
        } else if (query.length === 0) {
            loadAlbums();
        }
    });

    $('#search-artist-input').on('keyup', function () {
        var query = $(this).val();
        if (query.length > 2) {
            searchArtists(query);
        } else if (query.length === 0) {
            loadAlbums();
        }
    });

    $('#search-song-input').on('keyup', function () {
        var query = $(this).val();
        if (query.length > 2) {
            searchSongs(query);
        } else if (query.length === 0) {
            loadAlbums();
        }
    });
});
