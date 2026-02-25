// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "phimmoichill",
        "name": "PhimMoiChill",
        "version": "1.0.0",
        "baseUrl": "https://phimmoichill.my",
        "iconUrl": "https://phimmoichill.my/wp-content/uploads/2023/12/logo-pmc.png", // Icon mẫu
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Grid', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-show', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim Lẻ', slug: 'phim-le' },
        { name: 'Phim Bộ', slug: 'phim-bo' },
        { name: 'Phim Chiếu Rạp', slug: 'phim-chieu-rap' },
        { name: 'Hoạt Hình', slug: 'hoat-hinh' },
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Hài Hước', slug: 'hai-huoc' },
        { name: 'Viễn Tưởng', slug: 'vien-tuong' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'update' },
            { name: 'Xem nhiều', value: 'view' }
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

        var mainLists = ['phim-le', 'phim-bo', 'phim-chieu-rap', 'hoat-hinh', 'tv-show'];

        if (mainLists.indexOf(slug) >= 0) {
            finalPath = "/danh-sach/" + slug;
        } else {
            finalPath = "/the-loai/" + slug;
        }

        // Xử lý phân trang HTML
        if (page > 1) {
            finalPath += "/page-" + page;
        }

        return baseUrl + finalPath;
    } catch (e) {
        return "https://phimmoichill.my";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://phimmoichill.my/tim-kiem/" + encodeURIComponent(keyword);
    if (page > 1) url += "/page-" + page;
    return url;
}

function getUrlDetail(slug) {
    // Nếu slug lấy từ HTML đã chứa "/phim/...", ta chỉ nối baseUrl
    if (slug.indexOf('/phim/') !== -1) {
        return "https://phimmoichill.my" + slug;
    }
    return "https://phimmoichill.my/phim/" + slug;
}

// =============================================================================
// PARSERS (Xử lý chuỗi HTML)
// =============================================================================

function parseListResponse(htmlResponse) {
    try {
        var items = [];
        
        // Cấu trúc regex mẫu cho item phim (li > a > img & title)
        // Lưu ý: Cần chỉnh sửa lại Regex này nếu cấu trúc HTML của PhimMoiChill thay đổi
        var itemRegex = /<li[^>]*class="[^"]*item[^"]*"[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*>.*?<img[^>]*src="([^"]+)"/gs;
        
        var match;
        while ((match = itemRegex.exec(htmlResponse)) !== null) {
            var url = match[1] || "";
            var title = match[2] || "";
            var posterUrl = match[3] || "";
            
            // Trích xuất slug từ url (VD: https://phimmoichill.my/phim/ten-phim -> /phim/ten-phim)
            var slug = url.replace("https://phimmoichill.my", "");
            
            items.push({
                id: slug,
                title: title.trim(),
                posterUrl: posterUrl,
                backdropUrl: posterUrl,
                year: 0, 
                quality: "", // Có thể dùng thêm regex để bóc tách quality
                episode_current: "",
                lang: ""
            });
        }

        // Phân trang
        var totalPages = 1;
        var paginationRegex = /class="page-numbers[^>]*>(\d+)<\/a>/g;
        var pageMatch;
        while ((pageMatch = paginationRegex.exec(htmlResponse)) !== null) {
            var p = parseInt(pageMatch[1]);
            if (p > totalPages) totalPages = p;
        }

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: 1, // Trích xuất từ regex tương tự nếu cần
                totalPages: totalPages,
                totalItems: items.length,
                itemsPerPage: items.length
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(htmlResponse) {
    return parseListResponse(htmlResponse);
}

function parseMovieDetail(htmlResponse) {
    try {
        var titleMatch = htmlResponse.match(/<h1[^>]*class="title"[^>]*>(.*?)<\/h1>/);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "Unknown Title";

        var posterMatch = htmlResponse.match(/<div[^>]*class="image"[^>]*>.*?<img[^>]*src="([^"]+)"/s);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = htmlResponse.match(/<div[^>]*class="entry-content"[^>]*>(.*?)<\/div>/s);
        var description = descMatch ? descMatch[1].replace(/<[^>]*>/g, "").trim() : "";

        // Trích xuất các tập phim (Episodes)
        var servers = [];
        var episodes = [];
        var epRegex = /<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/g;
        var listEpHtmlMatch = htmlResponse.match(/<ul[^>]*class="list-episode"[^>]*>(.*?)<\/ul>/s);
        
        if (listEpHtmlMatch) {
            var listEpHtml = listEpHtmlMatch[1];
            var epMatch;
            while ((epMatch = epRegex.exec(listEpHtml)) !== null) {
                episodes.push({
                    id: epMatch[1], // Link trang xem phim
                    name: epMatch[3].trim(),
                    slug: epMatch[1]
                });
            }
        }

        if (episodes.length > 0) {
            servers.push({ name: "PhimMoiChill", episodes: episodes });
        }

        return JSON.stringify({
            id: "", // Gán lại slug nếu cần
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            year: 0,
            rating: 0,
            quality: "HD",
            servers: servers,
            episode_current: episodes.length > 0 ? episodes[episodes.length - 1].name : "1",
            lang: "Vietsub",
            category: "",
            country: "",
            director: "",
            casts: ""
        });
    } catch (error) { return "null"; }
}

function parseDetailResponse(htmlResponse) {
    try {
        // Trên trang xem phim, link video thường được ẩn trong iframe hoặc script (m3u8)
        var streamUrl = "";
        
        // Tìm iframe embed hoặc link m3u8 trong script
        var m3u8Match = htmlResponse.match(/(https:\/\/[^"']+\.m3u8[^"']*)/);
        var iframeMatch = htmlResponse.match(/<iframe[^>]*src="([^"]+)"/);

        if (m3u8Match) {
            streamUrl = m3u8Match[1];
        } else if (iframeMatch) {
            streamUrl = iframeMatch[1];
        }

        return JSON.stringify({
            url: streamUrl,
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 
                "Referer": "https://phimmoichill.my" 
            },
            subtitles: []
        });
    } catch (error) { return "{}"; }
}

function parseCategoriesResponse(htmlResponse) { return "[]"; }
function parseCountriesResponse(htmlResponse) { return "[]"; }
function parseYearsResponse(htmlResponse) { return "[]"; }
