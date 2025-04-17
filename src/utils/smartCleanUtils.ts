import type { DataType } from "../types";

// 网站类型定义
export type WebsiteCategory =
    | "social"      // 社交媒体
    | "video"       // 视频网站
    | "shopping"    // 购物网站
    | "banking"     // 银行/金融
    | "news"        // 新闻网站
    | "mail"        // 邮件服务
    | "forum"       // 论坛/社区
    | "search"      // 搜索引擎
    | "education"   // 教育网站
    | "other";      // 其他类型

// 网站分类规则
const websiteCategories: Record<string, WebsiteCategory> = {
    // 社交媒体
    "weibo.com": "social",
    "twitter.com": "social",
    "facebook.com": "social",
    "instagram.com": "social",
    "douyin.com": "social",
    "tiktok.com": "social",
    "xiaohongshu.com": "social",

    // 视频网站
    "bilibili.com": "video",
    "youtube.com": "video",
    "iqiyi.com": "video",
    "youku.com": "video",
    "netflix.com": "video",

    // 购物网站
    "taobao.com": "shopping",
    "jd.com": "shopping",
    "amazon.com": "shopping",
    "tmall.com": "shopping",
    "pinduoduo.com": "shopping",

    // 银行/金融
    "icbc.com.cn": "banking",
    "ccb.com": "banking",
    "paypal.com": "banking",
    "alipay.com": "banking",

    // 搜索引擎
    "baidu.com": "search",
    "google.com": "search",
    "bing.com": "search",
    "sogou.com": "search",

    // 其他常见网站...
};

// 根据网站类型推荐清理选项
const categoryRecommendations: Record<WebsiteCategory, DataType[]> = {
    social: ["cache", "localStorage"],
    video: ["cache", "serviceWorkers"],
    shopping: ["cache"],
    banking: [], // 金融网站通常不建议清理
    news: ["cache", "localStorage"],
    mail: ["cache"],
    forum: ["cache", "localStorage"],
    search: ["cache", "serviceWorkers"],
    education: ["cache"],
    other: ["cache"]
};

// 特定网站的自定义推荐
const domainSpecificRecommendations: Record<string, DataType[]> = {
    "bilibili.com": ["cache", "localStorage", "serviceWorkers"],
    "taobao.com": ["cache", "serviceWorkers"],
    // 其他特定网站...
};

/**
 * 获取网站类别
 * @param domain 网站域名
 * @returns 网站类别
 */
export function getWebsiteCategory(domain: string): WebsiteCategory {
    // 处理子域名
    const rootDomain = extractRootDomain(domain);

    // 查找预定义类别
    for (const [pattern, category] of Object.entries(websiteCategories)) {
        if (rootDomain.includes(pattern)) {
            return category;
        }
    }

    return "other";
}

/**
 * 提取根域名
 */
function extractRootDomain(domain: string): string {
    // 简单实现，实际应考虑更复杂的域名规则
    const parts = domain.split('.');
    if (parts.length <= 2) return domain;

    // 处理常见域名格式
    const tld = parts[parts.length - 1];
    const sld = parts[parts.length - 2];
    if (['com', 'org', 'net', 'edu'].includes(tld)) {
        return `${sld}.${tld}`;
    }

    // 处理国家域名 (例如: .co.uk, .com.cn)
    if (parts.length > 2 && tld.length === 2) {
        return `${parts[parts.length - 3]}.${sld}.${tld}`;
    }

    return `${sld}.${tld}`;
}

/**
 * 获取智能清理建议
 * @param domain 网站域名
 * @param userHistory 用户历史清理行为 (可选)
 * @returns 推荐的清理数据类型
 */
export function getSmartCleaningRecommendations(
    domain: string,
    userHistory?: { domain: string, dataTypes: DataType[] }[]
): DataType[] {
    // 优先检查特定网站推荐
    if (domainSpecificRecommendations[domain]) {
        return domainSpecificRecommendations[domain];
    }

    // 获取网站类别
    const category = getWebsiteCategory(domain);

    // 获取基于类别的推荐
    const baseRecommendations = categoryRecommendations[category] || ["cache"];

    // 如果有用户历史，结合历史进行个性化推荐
    if (userHistory && userHistory.length > 0) {
        // 查找用户对同类网站的清理偏好
        const similarSiteHistories = userHistory.filter(h =>
            getWebsiteCategory(h.domain) === category
        );

        if (similarSiteHistories.length > 0) {
            // 统计用户最常清理的数据类型
            const typeCounts: Record<DataType, number> = {} as Record<DataType, number>;

            similarSiteHistories.forEach(history => {
                history.dataTypes.forEach(type => {
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                });
            });

            // 找出用户偏好的数据类型 (至少清理过2次)
            const preferredTypes = Object.entries(typeCounts)
                .filter(([_, count]) => count >= 2)
                .map(([type]) => type as DataType);

            if (preferredTypes.length > 0) {
                // 合并基础推荐和用户偏好
                return [...new Set([...baseRecommendations, ...preferredTypes])];
            }
        }
    }

    return baseRecommendations;
}

/**
 * 生成清理建议文本
 */
export function getCleaningAdvice(domain: string, recommendedTypes: DataType[]): string {
    const category = getWebsiteCategory(domain);

    // 根据网站类型提供建议文本
    switch (category) {
        case "social":
            return "社交媒体网站通常缓存较多媒体内容，建议清理缓存和本地存储";
        case "video":
            return "视频网站缓存大量视频数据，建议定期清理缓存和Service Worker";
        case "shopping":
            return "购物网站可能存储大量商品图片，清理缓存可提升浏览体验";
        case "banking":
            return "金融网站建议谨慎清理，可能影响登录状态和安全验证";
        case "search":
            return "搜索引擎缓存可能影响搜索结果的即时性，建议定期清理";
        default:
            return "建议清理缓存以提升浏览体验";
    }
} 