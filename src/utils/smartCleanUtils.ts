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

// 根据网站类型推荐清理选项 - 包含新的数据类型，调整差异化推荐
const categoryRecommendations: Record<WebsiteCategory, DataType[]> = {
    social: ["cache", "localStorage"], // 社交网站主要清理基础缓存和本地存储
    video: ["cache", "serviceWorkers"], // 视频网站主要清理缓存和Service Worker
    shopping: ["cache"], // 购物网站仅建议清理缓存
    banking: [], // 金融网站通常不建议清理
    news: ["cache"], // 新闻网站只需清理缓存
    mail: ["cache"], // 邮件服务主要清理缓存
    forum: ["cache", "localStorage"], // 论坛清理缓存和本地存储
    search: ["cache"], // 搜索引擎只需清理缓存
    education: ["cache"], // 教育网站只需清理缓存
    streaming: ["cache", "serviceWorkers"], // 流媒体清理缓存和Service Worker
    webapp: ["cache", "localStorage", "indexedDB" as DataType], // 仅Web应用需要更全面的清理
    other: ["cache"] // 其他网站默认只清理缓存
};

// 特定网站的自定义推荐 - 明确需要高级清理的网站
const domainSpecificRecommendations: Record<string, DataType[]> = {
    // 高级多媒体网站需要更全面的清理
    "bilibili.com": ["cache", "localStorage", "serviceWorkers", "indexedDB" as DataType],
    "youtube.com": ["cache", "serviceWorkers", "indexedDB" as DataType],

    // 大型电商平台
    "taobao.com": ["cache", "serviceWorkers", "localStorage"],
    "jd.com": ["cache", "localStorage"],

    // 生产力工具
    "gmail.com": ["cache", "localStorage"],
    "docs.google.com": ["cache", "localStorage", "indexedDB" as DataType],
    "github.com": ["cache", "localStorage"],

    // 内容平台
    "zhihu.com": ["cache", "serviceWorkers", "localStorage"],

    // SPA应用
    "notion.so": ["cache", "localStorage", "indexedDB" as DataType],
    "figma.com": ["cache", "localStorage", "indexedDB" as DataType],
    "trello.com": ["cache", "localStorage", "indexedDB" as DataType],
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
 * 检查域名是否为复杂Web应用
 * @param domain 域名
 * @returns 是否为复杂Web应用
 */
const isComplexWebApp = (domain: string): boolean => {
    // 检查域名是否包含可能表示为复杂应用的关键词
    return /app|portal|dashboard|admin|account|system|platform/.test(domain.toLowerCase());
};

/**
 * 获取智能清理建议
 * @param domain 当前域名
 * @returns 推荐清理的数据类型数组
 */
export const getSmartCleaningRecommendations = (
    domain: string,
): DataType[] => {
    // 默认推荐清理的数据类型
    const defaultRecommendations: DataType[] = ["cache", "serviceWorkers"];

    // 获取网站类别
    const category = getWebsiteCategory(domain);

    // 根据网站类别获取推荐
    if (category && categoryRecommendations[category]) {
        return [...categoryRecommendations[category]];
    }

    // 检查是否是复杂Web应用
    if (isComplexWebApp(domain)) {
        return [
            ...defaultRecommendations,
            "localStorage",
            "indexedDB" as DataType,
            "sessionStorage" as DataType,
        ];
    }

    // 对于特定域名的特殊处理
    if (domainSpecificRecommendations[domain]) {
        return [...domainSpecificRecommendations[domain]];
    }

    // 返回默认推荐
    return defaultRecommendations;
};

/**
 * 模拟分析网站存储使用情况
 * 实际实现应该检测真实存储使用量
 */
function analyzeStorageUsage(domain: string): DataType[] {
    // 这里仅作示例，实际应该检测真实存储
    const category = getWebsiteCategory(domain);

    // 只针对特定的Web应用推荐高级数据类型
    if (category === "webapp") {
        return ["localStorage", "indexedDB" as DataType];
    }

    // 对于视频网站，建议清理Service Worker
    if (category === "video" || category === "streaming") {
        return ["serviceWorkers"];
    }

    // 对于社交媒体，建议清理本地存储
    if (category === "social") {
        return ["localStorage"];
    }

    // 默认情况下不主动推荐高级数据类型
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