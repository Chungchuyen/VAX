// =============================================================================
// CONFIGURATION & METADATA - PHIMMOICHILL
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "phimmoichill",
        "name": "PhimMoiChill",
        "version": "1.0.0",
        "baseUrl": "https://phimmoichill.my",
        "iconUrl": "https://phimmoichill.my/favicon.ico",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Phim Hoạt Hình', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim Mới', slug: 'phim-moi' },
        { name: 'Phim Bộ', slug: 'phim-bo' },
        { name: 'Phim Lẻ', slug: 'phim-le' },
        { name: 'Phim Chiếu Rạp', slug: 'phim-chieu-rap' },
        { name: 'Phim Thuyết Minh', slug: 'phim-thuyet-minh' },
        { name: 'Phim Vietsub', slug: 'phim-vietsub' },
        { name: 'Hoạt Hình', slug: 'hoat-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Ngày cập nhật', value: 'update' },
            { name: 'Năm phát hành', value: 'year' },
            { name: 'Lượt xem', value: 'view' }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var baseUrl = "https://phimmoichill.my";
        var finalPath = "";

        // PhimMoiChill thường dùng cấu trúc /slug/page/2/
        if (slug === 'phim-moi') {
            finalPath = "/danh-sach/phim-moi";
        } else if (filters.category) {
            finalPath = "/the-loai/" + filters.category;
        } else if (filters.country) {
            finalPath = "/quoc-gia/" + filters.country;
        } else if (filters.year) {
            finalPath = "/nam-phat-hanh/" + filters.year;
        } else {
            finalPath = "/" + slug;
        }

        var url = baseUrl + finalPath + (page > 1 ? "/page/" + page : "");
        return url;
    } catch (e) {
        return "https://phimmoichill.my/danh-sach/phim-moi";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    // Cấu trúc tìm kiếm: https://phimmoichill.my/tim-kiem/keyword/page/1
    return "https://phimmoichill.my/tim-kiem/" + encodeURIComponent(keyword) + (page > 1 ? "/page/" + page : "");
}

function getUrlDetail(slug) {
    // Nếu slug đã là URL tuyệt đối thì giữ nguyên, nếu không thì nối base
    if (slug.indexOf('http') === 0) return slug;
    return "https://phimmoichill.my/phim/" + slug;
}

// Các hàm bổ trợ (Nếu site có API riêng, nếu không hàm này sẽ trả về list cứng)
function getUrlCategories() { return "https://phimmoichill.my"; }
function getUrlCountries() { return "https://phimmoichill.my"; }
function getUrlYears() { return "https://phimmoichill.my"; }

// =============================================================================
// PARSERS (Lưu ý: PhimMoiChill cần Parser HTML thay vì JSON.parse)
// =============================================================================

function parseListResponse(apiResponseHtml) {
    // Lưu ý: Đây là nơi bạn cần dùng Regex hoặc thư viện DOM Parser 
    // để bóc tách dữ liệu từ HTML của phimmoichill.my
    try {
        // Đoạn này giả định hệ thống của bạn có một middleware 
        // chuyển HTML thành JSON tương tự cấu trúc OPhim
        var response = JSON.parse(apiResponseHtml); 
        var items = response.items || [];
        
        return JSON.stringify({
            items: items.map(function(item) {
                return {
                    id: item.slug,
                    title: item.name,
                    posterUrl: item.thumb_url,
                    year: item.year || "",
                    quality: item.quality || "HD",
                    episode_current: item.episode_current || "",
                    lang: item.lang || "Vietsub"
                };
            }),
            pagination: response.pagination
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseMovieDetail(apiResponseHtml) {
    // Logic tách metadata từ HTML: Tên phim, ảnh, mô tả, danh sách tập phim
    try {
        var movie = JSON.parse(apiResponseHtml); 
        return JSON.stringify(movie);
    } catch (error) { return "null"; }
}

function getImageUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    return "https://phimmoichill.my" + path;
}
