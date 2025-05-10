/**
 * 针对特定域名提供智能清理建议
 * 根据域名特点返回推荐清理的数据类型
 * @param domain 需要清理的网站域名
 * @returns 推荐清理的数据类型数组
 */
export const getSmartCleaningRecommendations = (domain: string): string[] => {
    // 默认推荐清理缓存和cookies
    const recommendations: string[] = ["cache", "cookies"];

    // 社交媒体网站，增加localStorage清理
    if (
        domain.includes("weibo") ||
        domain.includes("facebook") ||
        domain.includes("twitter") ||
        domain.includes("instagram") ||
        domain.includes("linkedin")
    ) {
        recommendations.push("localStorage");
        recommendations.push("sessionStorage");
    }

    // 视频网站，增加大容量缓存清理
    if (
        domain.includes("youtube") ||
        domain.includes("bilibili") ||
        domain.includes("iqiyi") ||
        domain.includes("netflix") ||
        domain.includes("youku")
    ) {
        recommendations.push("localStorage");
        recommendations.push("fileSystem");
    }

    // 购物网站，保留cookies但清理其他缓存
    if (
        domain.includes("amazon") ||
        domain.includes("taobao") ||
        domain.includes("jd") ||
        domain.includes("tmall")
    ) {
        // 购物网站通常保留cookies以保持登录状态
        return ["cache", "localStorage", "sessionStorage"];
    }

    // 银行和金融网站，增加安全考虑
    if (
        domain.includes("bank") ||
        domain.includes("pay") ||
        domain.includes("alipay") ||
        domain.includes("invest") ||
        domain.includes("secure")
    ) {
        recommendations.push("localStorage");
        recommendations.push("sessionStorage");
        recommendations.push("indexedDB");
        recommendations.push("formData");
    }

    // 邮箱和文档网站，处理潜在的草稿内容
    if (
        domain.includes("mail") ||
        domain.includes("docs") ||
        domain.includes("office") ||
        domain.includes("document")
    ) {
        recommendations.push("localStorage");
        recommendations.push("indexedDB");
    }

    return recommendations;
};

/**
 * 获取针对特定域名的清理建议文本
 * @param domain 网站域名
 * @param recommendations 推荐清理的数据类型
 * @returns 清理建议的说明文本
 */
export const getCleaningAdvice = (
    domain: string,
    recommendations: string[]
): string => {
    // 社交媒体网站
    if (
        domain.includes("weibo") ||
        domain.includes("facebook") ||
        domain.includes("twitter") ||
        domain.includes("instagram")
    ) {
        return "社交媒体网站存储了大量的个人信息和浏览历史，清理这些数据有助于保护您的隐私并释放存储空间。";
    }

    // 视频网站
    if (
        domain.includes("youtube") ||
        domain.includes("bilibili") ||
        domain.includes("iqiyi") ||
        domain.includes("netflix")
    ) {
        return "视频网站通常缓存大量媒体文件，清理这些缓存可以释放大量存储空间。";
    }

    // 购物网站
    if (
        domain.includes("amazon") ||
        domain.includes("taobao") ||
        domain.includes("jd") ||
        domain.includes("tmall")
    ) {
        return "已保留购物网站的登录状态，仅清理不必要的缓存数据以加快页面加载速度。";
    }

    // 银行和金融网站
    if (
        domain.includes("bank") ||
        domain.includes("pay") ||
        domain.includes("alipay") ||
        domain.includes("invest")
    ) {
        return "出于安全考虑，建议彻底清理金融网站的所有本地数据，以防止敏感信息泄露。";
    }

    // 邮箱和文档网站
    if (
        domain.includes("mail") ||
        domain.includes("docs") ||
        domain.includes("office")
    ) {
        return "清理邮箱和文档网站的缓存可能会导致未保存的草稿丢失，已选择性地保留某些数据。";
    }

    // 新闻网站
    if (
        domain.includes("news") ||
        domain.includes("sina") ||
        domain.includes("sohu") ||
        domain.includes("163")
    ) {
        return "新闻网站通常包含大量的广告跟踪器，清理这些数据可以提高浏览体验和隐私保护。";
    }

    // 默认建议
    const typesCount = recommendations.length;
    return `根据分析，建议清理该网站的${typesCount}种数据类型，这将有助于提升浏览性能和保护隐私。`;
}; 