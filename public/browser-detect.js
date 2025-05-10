/**
 * ClearPage浏览器检测脚本
 * 用于检测用户浏览器类型并跳转到相应的下载页面
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    // 获取"立即安装"按钮元素
    const installButton = document.getElementById('installButton');

    // 为按钮添加点击事件监听器
    if (installButton) {
        installButton.addEventListener('click', function (event) {
            // 阻止默认行为（避免页面跳转到"#"）
            event.preventDefault();

            // 调用浏览器检测函数
            detectBrowserAndRedirect();
        });
    }
});

/**
 * 检测浏览器类型并根据不同浏览器跳转到相应的下载链接
 */
function detectBrowserAndRedirect() {
    const userAgent = navigator.userAgent.toLowerCase();
    let downloadUrl = "https://github.com/yangyuan-zhen/ClearPage"; // 默认为GitHub链接

    // 检测Chrome浏览器
    if (userAgent.indexOf("chrome") > -1 && userAgent.indexOf("edg") === -1) {
        downloadUrl = "https://chromewebstore.google.com/detail/hahofbfafmpamekbgbbeglmboplogghe?utm_source=item-share-cb";
    }
    // 检测Edge浏览器
    else if (userAgent.indexOf("edg") > -1) {
        downloadUrl = "https://microsoftedge.microsoft.com/addons/detail/%E7%BD%91%E9%A1%B5%E6%95%B0%E6%8D%AE%E6%B8%85%E7%90%86%E5%B7%A5%E5%85%B7/ejdlnpciopfnbcmhpblfhhoelolmagbj?hl=zh-CN";
    }

    // 跳转到相应的下载链接
    window.location.href = downloadUrl;
} 