// 监听 popstate 事件，在历史记录状态改变时触发
window.addEventListener('popstate', function (event) {
    checkUrlPage();
});
var globalpage = 0;

$(document).ready(function () {
    // 页面初始化时的处理

    checkUrlPage();

    // 监听 popstate 事件，以便在用户点击浏览器的前进或后退按钮时检查URL路径
    window.addEventListener('popstate', function (event) {
        checkUrlPage();

    });
});



// 检查当前URL是否为 /albums/<album_id>，如果是则执行相应的方法
function checkUrlPage(urlpage) {

    var currentPath = window.location.pathname;
    var urlPageRegex = /^\/albums\/[\w\d]+$/; // 此处使用正则表达式检查路径格式，可以根据实际情况调整

    if (urlPageRegex.test(currentPath)) {
        // 提取album_id
        var album_id = currentPath.split('/')[2]; // 假设路径格式为 /albums/<album_id>
        //console.log('check url album_id:', album_id);
        // 执行你的JavaScript方法，例如加载专辑详情
        loadAlbumDetails(album_id);
        return;
    }
    var urlPageRegex = /^\/artist\/[\w\d]+$/; // 此处使用正则表达式检查路径格式，可以根据实际情况调整

    if (urlPageRegex.test(currentPath)) {
        // 提取artistId
        var artist_id = currentPath.split('/')[2]; // 假设路径格式为 /artistId/<album_id>
        //console.log('check url artist_id:', artist_id);
        // 执行你的JavaScript方法，例如加载专辑详情
        loadArtistDetails(artist_id);
        return;
    }
    ///搜索相关的
    var urlPageRegexAlbums = /^\/searchAlbums\/.*$/; // 匹配以 /searchAlbums/ 开头的路径

    if (urlPageRegexAlbums.test(currentPath)) {
        var query = currentPath.split('/')[2]; // 假设路径格式为 /searchAlbums/<album_id>
        searchAlbums(decodeURIComponent(query));
        return;
    }

    var urlPageRegexArtists = /^\/searchArtists\/.*$/; // 匹配以 /searchArtists/ 开头的路径

    if (urlPageRegexArtists.test(currentPath)) {
        var query = currentPath.split('/')[2]; // 假设路径格式为 /searchArtists/<artist_id>
        searchArtists(decodeURIComponent(query));
        return;
    }

    var urlPageRegexSongs = /^\/searchSongs\/.*$/; // 匹配以 /searchSongs/ 开头的路径

    if (urlPageRegexSongs.test(currentPath)) {
        var query = currentPath.split('/')[2]; // 假设路径格式为 /searchSongs/<song_id>
        searchSongs(decodeURIComponent(query));
        return;
    }


    ///以上是搜索相关的

    var urlPageRegex = /^\/albumlist\/\d+$/;

    if (urlPageRegex.test(currentPath)) {
        // 提取artistId
        var albumListPage = currentPath.split('/')[2]; // 假设路径格式为 /artistId/<album_id>
        //console.log('check url albumListPage:', albumListPage);
        // 执行你的JavaScript方法，例如加载专辑详情
        globalpage = parseInt(albumListPage);
        loadAlbums(albumListPage);
        return;
    }
    loadAlbums(globalpage);

}

function upPage() {
    if (globalpage > 0) {
        globalpage = globalpage - 1;
        loadAlbums(globalpage);
    }
}

function downPage() {
    globalpage = globalpage + 1;
    loadAlbums(globalpage);
}


// 获取按钮和浮动窗口元素
var button = document.getElementById('about-button');
var popup = document.createElement('div');
popup.className = 'popup';

// 添加要显示的内容：笑脸emoji和文本（使用innerHTML来支持换行）
var emoji = document.createElement('span');
emoji.textContent = '😊'; // 笑脸emoji

var text = document.createElement('p');
text.innerHTML = '东方音乐播放站，版权没有<br>有事请联系：admin@thmusic.top<br>如果需要大幅度翻页请直接修改网址里的页面数目<br>就是网址最后的数字。<br>截至目前（2024年6月26日）总共721页。'; // 文本内容，使用innerHTML来支持换行

// 将内容添加到浮动窗口
popup.appendChild(emoji);
popup.appendChild(text);

// 将浮动窗口添加到文档中
document.body.appendChild(popup);

// 点击按钮时显示浮动窗口
function showPopup() {
    popup.style.display = 'block';
}

// 点击浮动窗口外部任意位置隐藏浮动窗口（可选）
window.addEventListener('click', function (event) {
    if (event.target !== button && event.target !== popup) {
        popup.style.display = 'none';
    }
});
