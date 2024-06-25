$(document).ready(function () {
    // 初始化加载专辑
    

    // 搜索功能
    $('#search-album-input').on('keyup', function () {
        var query = $(this).val();
        if (query.length > 2) {
            searchAlbums(query);
        } else if (query.length === 0) {
            loadAlbums(globalpage);
        }
    });

    $('#search-artist-input').on('keyup', function () {
        var query = $(this).val();
        if (query.length > 2) {
            searchArtists(query);
        } else if (query.length === 0) {
            loadAlbums(globalpage);
        }
    });

    $('#search-song-input').on('keyup', function () {
        var query = $(this).val();
        if (query.length > 2) {
            searchSongs(query);
        } else if (query.length === 0) {
            loadAlbums(globalpage);
        }
    });
});

// 检查当前URL是否为 /albums/<album_id>，如果是则执行相应的方法
function checkUrlPage(urlpage) {
    
    var currentPath = window.location.pathname;
    var urlPageRegex = /^\/albums\/[\w\d]+$/; // 此处使用正则表达式检查路径格式，可以根据实际情况调整

    if (urlPageRegex.test(currentPath)) {
        // 提取album_id
        var album_id = currentPath.split('/')[2]; // 假设路径格式为 /albums/<album_id>
        console.log('check url album_id:', album_id);
        // 执行你的JavaScript方法，例如加载专辑详情
        loadAlbumDetails(album_id);
    }
    var urlPageRegex = /^\/artist\/[\w\d]+$/; // 此处使用正则表达式检查路径格式，可以根据实际情况调整

    if (urlPageRegex.test(currentPath)) {
        // 提取artistId
        var artist_id = currentPath.split('/')[2]; // 假设路径格式为 /artistId/<album_id>
        console.log('check url artist_id:', artist_id);
        // 执行你的JavaScript方法，例如加载专辑详情
        loadArtistDetails(artist_id);
    }

    var urlPageRegex = /^\/albumlist\/\d+$/;

    if (urlPageRegex.test(currentPath)) {
        // 提取artistId
        var albumListPage = currentPath.split('/')[2]; // 假设路径格式为 /artistId/<album_id>
        console.log('check url albumListPage:', albumListPage);
        // 执行你的JavaScript方法，例如加载专辑详情
        globalpage = albumListPage;
        loadAlbums(albumListPage);
    }
    else
    {      
    loadAlbums(globalpage);
    }
}

function upPage() {
    if(globalpage > 0)
        {
        globalpage = globalpage - 1;
        loadAlbums(globalpage);
        }
}

function downPage() {
    globalpage = globalpage + 1;
    loadAlbums(globalpage);
}
