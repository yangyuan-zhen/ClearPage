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
    | "streaming"   // 流媒体服务
    | "webapp"      // Web应用
    | "other";      // 其他类型

// 网站分类规则 - 扩展并优化
const websiteCategories: Record<string, WebsiteCategory> = {
    // 社交媒体
    "weibo.com": "social",
    "twitter.com": "social",
    "facebook.com": "social",
    "instagram.com": "social",
    "douyin.com": "social",
    "tiktok.com": "social",
    "xiaohongshu.com": "social",
    "linkedin.com": "social",
    "zhihu.com": "social",
    "qq.com": "social",
    "discord.com": "social",
    "reddit.com": "social",

    // 视频网站
    "bilibili.com": "video",
    "youtube.com": "video",
    "iqiyi.com": "video",
    "youku.com": "video",
    "netflix.com": "streaming",
    "hulu.com": "streaming",
    "douyu.com": "video",
    "huya.com": "video",

    // 购物网站
    "taobao.com": "shopping",
    "jd.com": "shopping",
    "amazon.com": "shopping",
    "tmall.com": "shopping",
    "pinduoduo.com": "shopping",
    "suning.com": "shopping",
    "walmart.com": "shopping",
    "ebay.com": "shopping",
    "aliexpress.com": "shopping",

    // 银行/金融
    "icbc.com.cn": "banking",
    "ccb.com": "banking",
    "paypal.com": "banking",
    "alipay.com": "banking",
    "wechat.com": "banking",
    "chase.com": "banking",
    "wellsfargo.com": "banking",

    // 搜索引擎
    "baidu.com": "search",
    "google.com": "search",
    "bing.com": "search",
    "sogou.com": "search",
    "360.cn": "search",
    "yahoo.com": "search",

    // 新闻网站
    "news.sina.com.cn": "news",
    "thepaper.cn": "news",
    "cnn.com": "news",
    "bbc.com": "news",
    "nytimes.com": "news",

    // 邮件服务
    "mail.163.com": "mail",
    "gmail.com": "mail",
    "outlook.com": "mail",
    "mail.qq.com": "mail",

    // Web应用
    "docs.google.com": "webapp",
    "github.com": "webapp",
    "notion.so": "webapp",
    "figma.com": "webapp",
    "trello.com": "webapp",
    "slack.com": "webapp",
    "feishu.cn": "webapp",
    "dingtalk.com": "webapp",
};

// 根据网站类型推荐清理选项 - 包含新的数据类型
const categoryRecommendations: Record<WebsiteCategory, DataType[]> = {
    social: ["cache", "localStorage", "indexedDB" as DataType],
    video: ["cache", "serviceWorkers", "indexedDB" as DataType],
    shopping: ["cache", "sessionStorage" as DataType],
    banking: [], // 金融网站通常不建议清理
    news: ["cache", "localStorage"],
    mail: ["cache", "serviceWorkers"],
    forum: ["cache", "localStorage", "indexedDB" as DataType],
    search: ["cache", "serviceWorkers"],
    education: ["cache", "localStorage"],
    streaming: ["cache", "serviceWorkers", "indexedDB" as DataType],
    webapp: ["cache", "localStorage", "indexedDB" as DataType, "sessionStorage" as DataType],
    other: ["cache"]
};

// 特定网站的自定义推荐 - 扩展并明确标记新数据类型
const domainSpecificRecommendations: Record<string, DataType[]> = {
    "bilibili.com": ["cache", "localStorage", "serviceWorkers", "indexedDB" as DataType],
    "youtube.com": ["cache", "serviceWorkers", "indexedDB" as DataType, "webSQL" as DataType],
    "taobao.com": ["cache", "serviceWorkers", "localStorage", "sessionStorage" as DataType],
    "gmail.com": ["cache", "localStorage", "serviceWorkers"],
    "docs.google.com": ["cache", "localStorage", "indexedDB" as DataType],
    "github.com": ["cache", "localStorage", "sessionStorage" as DataType],
    "zhihu.com": ["cache", "serviceWorkers", "indexedDB" as DataType],
};

/**
 * 获取网站类别
 * @param domain 网站域名
 * @returns 网站类别
 */
export function getWebsiteCategory(domain: string): WebsiteCategory {
    // 处理子域名
    const rootDomain = extractRootDomain(domain);

    // 精确匹配优先
    if (websiteCategories[domain]) {
        return websiteCategories[domain];
    }

    // 查找预定义类别 - 部分匹配
    for (const [pattern, category] of Object.entries(websiteCategories)) {
        if (rootDomain.includes(pattern) || pattern.includes(rootDomain)) {
            return category;
        }
    }

    return "other";
}

/**
 * 提取根域名 - 优化提取逻辑
 */
function extractRootDomain(domain: string): string {
    // 处理为空或无效域名的情况
    if (!domain || domain.indexOf('.') === -1) return domain;

    // 移除端口号和路径
    domain = domain.split(':')[0].split('/')[0];

    const parts = domain.split('.');
    if (parts.length <= 2) return domain;

    // 处理国际域名
    const tld = parts[parts.length - 1];
    const sld = parts[parts.length - 2];

    // 常见顶级域名
    if (['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'io', 'co', 'ai', 'app', 'dev'].includes(tld)) {
        return `${sld}.${tld}`;
    }

    // 处理国家域名 (例如: .co.uk, .com.cn)
    if (parts.length > 2 && (tld.length === 2 || ['com', 'co', 'org', 'net', 'edu', 'gov'].includes(sld))) {
        // 判断是否为三级域名格式
        if (tld.length === 2 || ['cn', 'uk', 'jp', 'au', 'nz', 'br'].includes(tld)) {
            return `${parts[parts.length - 3]}.${sld}.${tld}`;
        }
    }

    return `${sld}.${tld}`;
}

/**
 * 获取智能清理建议 - 改进推荐算法
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

    // 尝试匹配根域名
    const rootDomain = extractRootDomain(domain);
    if (domainSpecificRecommendations[rootDomain]) {
        return domainSpecificRecommendations[rootDomain];
    }

    // 获取网站类别
    const category = getWebsiteCategory(domain);

    // 获取基于类别的推荐
    let baseRecommendations = categoryRecommendations[category] || ["cache"];

    // 网页存储使用情况分析 (模拟实现，实际应该检测真实存储使用量)
    const storage: DataType[] = analyzeStorageUsage(domain);
    if (storage.length > 0) {
        baseRecommendations = [...new Set([...baseRecommendations, ...storage])];
    }

    // 如果有用户历史，结合历史进行个性化推荐
    if (userHistory && userHistory.length > 0) {
        // 查找用户对同类网站的清理偏好
        const similarSiteHistories = userHistory.filter(h => {
            // 同类别或同根域名
            return getWebsiteCategory(h.domain) === category ||
                extractRootDomain(h.domain) === extractRootDomain(domain);
        });

        if (similarSiteHistories.length > 0) {
            // 统计用户最常清理的数据类型
            const typeCounts: Record<string, number> = {};

            similarSiteHistories.forEach(history => {
                history.dataTypes.forEach(type => {
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                });
            });

            // 找出用户偏好的数据类型 (权重分析)
            const preferredTypes = Object.entries(typeCounts)
                .sort((a, b) => b[1] - a[1]) // 按频率排序
                .slice(0, 3) // 取前三个最常使用的
                .map(([type]) => type as DataType);

            if (preferredTypes.length > 0) {
                // 合并基础推荐和用户偏好，去重
                return [...new Set([...baseRecommendations, ...preferredTypes])];
            }
        }

        // 检查用户最近的清理行为
        const recentHistory = [...userHistory].sort((a, b) => {
            // 假设历史记录中有时间戳，这里仅为示例
            return (b as any).timestamp - (a as any).timestamp;
        }).slice(0, 5); // 取最近5条

        if (recentHistory.length > 0) {
            // 从最近历史中提取常用数据类型
            const recentTypes = new Set<DataType>();
            recentHistory.forEach(h => {
                h.dataTypes.forEach(t => recentTypes.add(t));
            });

            // 添加到推荐中
            return [...new Set([...baseRecommendations, ...recentTypes])];
        }
    }

    return baseRecommendations;
}

/**
 * 模拟分析网站存储使用情况
 * 实际实现应该检测真实存储使用量
 */
function analyzeStorageUsage(domain: string): DataType[] {
    // 这里仅作示例，实际应该检测真实存储
    const category = getWebsiteCategory(domain);

    if (category === "social" || category === "video") {
        return ["indexedDB" as DataType, "localStorage"];
    }

    if (category === "webapp") {
        return ["localStorage", "indexedDB" as DataType, "sessionStorage" as DataType];
    }

    if (category === "shopping") {
        return ["localStorage", "sessionStorage" as DataType];
    }

    return [];
}

/**
 * 生成清理建议文本 - 优化建议文本内容
 */
export function getCleaningAdvice(domain: string, recommendedTypes: DataType[]): string {
    const category = getWebsiteCategory(domain);
    const types = recommendedTypes.map(type => {
        // 将DataType转换为友好名称
        switch (type) {
            case "cache": return "缓存";
            case "cookies": return "Cookie";
            case "localStorage": return "本地存储";
            case "serviceWorkers": return "Service Worker";
            case "indexedDB": return "IndexedDB数据库";
            case "sessionStorage": return "会话存储";
            case "webSQL": return "WebSQL数据库";
            case "formData": return "表单数据";
            case "fileSystem": return "文件系统";
            default: return type;
        }
    }).join("、");

    // 根据网站类型和推荐清理的数据类型提供定制建议文本
    switch (category) {
        case "social":
            return `社交媒体网站通常缓存较多媒体内容和个人数据，清理${types}可提升浏览流畅度和释放存储空间`;
        case "video":
            return `视频网站缓存大量视频数据，建议定期清理${types}以释放空间和改善播放体验`;
        case "streaming":
            return `流媒体服务存储大量缓存内容，清理${types}可帮助解决播放卡顿问题`;
        case "shopping":
            return `购物网站可能保存大量商品数据和浏览记录，清理${types}可加快网页加载速度`;
        case "banking":
            return `金融网站包含敏感信息，谨慎清理，仅在必要时清理${types}，可能导致需要重新登录`;
        case "search":
            return `搜索引擎缓存可能影响搜索结果的准确性，建议清理${types}以获取最新搜索结果`;
        case "news":
            return `新闻网站经常更新内容，清理${types}可确保获取最新信息并加快页面加载`;
        case "mail":
            return `邮件服务可能存储较多缓存数据，清理${types}可解决邮件加载慢或功能异常的问题`;
        case "webapp":
            return `Web应用积累较多数据可能导致性能下降，定期清理${types}可提升应用响应速度`;
        default:
            if (recommendedTypes.some(t => t === "cookies")) {
                return `建议清理${types}以提升浏览体验，注意清理Cookie将导致登录状态丢失`;
            } else {
                return `建议清理${types}以提升浏览体验和加快网页加载速度`;
            }
    }
} 