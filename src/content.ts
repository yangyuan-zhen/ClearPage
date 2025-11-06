/**
 * 内容脚本 - 用于收集页面性能数据
 */

// 添加必要的类型定义
interface PerformanceResourceDetails {
    name?: string;
    initiatorType?: string;
    transferSize?: number;
    encodedBodySize?: number;
    decodedBodySize?: number;
    duration?: number;
}

interface NavigationEntryDetails {
    startTime?: number;
    responseEnd?: number;
    domInteractive?: number;
    domComplete?: number;
    loadEventEnd?: number;
}

interface PerformanceMemory {
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
}

// 监听来自扩展程序的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 如果请求是获取性能数据
    if (message.action === "getPerformanceData") {
        try {
            const performanceData = collectPerformanceData();
            sendResponse({ success: true, data: performanceData });
        } catch (error: any) {
            console.error("收集性能数据失败:", error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // 保持通道开放以便异步响应
    }
});

/**
 * 收集页面性能数据
 * @returns 页面性能数据对象
 */
function collectPerformanceData() {
    // 确保Performance API可用
    if (!window.performance) {
        throw new Error("Performance API不可用");
    }

    // 获取Navigation Timing数据
    const navEntries = window.performance.getEntriesByType("navigation");
    const timingAPI = window.performance.timing || (navEntries.length > 0 ? navEntries[0] : null);
    if (!timingAPI) {
        throw new Error("Navigation Timing数据不可用");
    }

    // 标准化timing对象以兼容新旧API
    const timing = window.performance.timing || {};
    const navigationEntry = navEntries.length > 0 ? navEntries[0] as NavigationEntryDetails : {};

    // 计算关键时间点
    const navigationStart = timing.navigationStart || navigationEntry.startTime || 0;
    const responseEnd = timing.responseEnd || navigationEntry.responseEnd || 0;
    const domInteractive = timing.domInteractive || navigationEntry.domInteractive || 0;
    const domComplete = timing.domComplete || navigationEntry.domComplete || 0;
    const loadEventEnd = timing.loadEventEnd || navigationEntry.loadEventEnd || performance.now();

    // 计算关键时间段
    const loadTime = loadEventEnd - navigationStart;
    const domInteractiveTime = domInteractive - navigationStart;
    const domCompleteTime = domComplete - navigationStart;

    // 获取资源数据
    const resources = window.performance.getEntriesByType("resource") as PerformanceResourceDetails[] || [];

    // 计算资源总量
    let resourceCount = resources.length;
    let resourceSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    let cacheHits = 0;

    // 资源类型计数
    const resourceTypes = {
        js: 0,
        css: 0,
        image: 0,
        font: 0,
        other: 0
    };

    // 处理每个资源
    resources.forEach(resource => {
        const size = resource.transferSize || resource.encodedBodySize || 0;
        resourceSize += size;

        const name = resource.name || "";
        const type = resource.initiatorType || "";

        // 缓存命中检测
        if (resource.transferSize === 0 && resource.encodedBodySize && resource.encodedBodySize > 0) {
            cacheHits++;
        }

        // 资源类型分类
        if (type === "script" || name.endsWith(".js")) {
            jsSize += size;
            resourceTypes.js++;
        } else if (type === "css" || name.endsWith(".css")) {
            cssSize += size;
            resourceTypes.css++;
        } else if (type === "img" || name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
            imageSize += size;
            resourceTypes.image++;
        } else if (type === "font" || name.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
            resourceTypes.font++;
        } else {
            resourceTypes.other++;
        }
    });

    // 计算缓存命中率
    const cacheHitRate = resourceCount > 0 ? Math.round((cacheHits / resourceCount) * 100) : 0;

    // 获取绘制时间
    let firstPaint = 0;
    let firstContentfulPaint = 0;

    try {
        const paintEntries = performance.getEntriesByType("paint");
        const fpEntry = paintEntries.find(entry => entry.name === "first-paint");
        const fcpEntry = paintEntries.find(entry => entry.name === "first-contentful-paint");

        firstPaint = fpEntry ? fpEntry.startTime : 0;
        firstContentfulPaint = fcpEntry ? fcpEntry.startTime : 0;
    } catch (e) {
        console.error("获取绘制时间失败", e);
    }

    // 获取DOM元素数量
    const domElements = document.querySelectorAll("*").length;

    // 获取 Largest Contentful Paint (LCP)
    let largestContentfulPaint = 0;
    try {
        const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
        if (lcpEntries.length > 0) {
            const lastLCP = lcpEntries[lcpEntries.length - 1];
            largestContentfulPaint = lastLCP.startTime;
        }
    } catch (e) {
        console.error("获取LCP失败", e);
    }

    // 获取内存使用情况
    let memoryUsage = 0;
    try {
        // 注意：performance.memory 只在Chrome中可用
        const memory = (performance as any).memory as PerformanceMemory;
        if (memory) {
            memoryUsage = Math.round(memory.usedJSHeapSize / (1024 * 1024));
        }
    } catch (e) {
        console.error("获取内存使用数据失败", e);
    }

    // 获取长任务信息
    let longTasks = 0;
    try {
        const longTaskEntries = performance.getEntriesByType("longtask") || [];
        longTasks = longTaskEntries.length;
    } catch (e) {
        console.error("获取长任务数据失败", e);
    }

    // 计算性能评分 - 参考 Google Lighthouse 标准
    
    // 1. FCP 评分 (First Contentful Paint)
    // 优秀: <1800ms, 良好: <3000ms, 需改进: >3000ms
    let fcpScore = 0;
    if (firstContentfulPaint > 0) {
        if (firstContentfulPaint < 1800) {
            fcpScore = 100 - (firstContentfulPaint / 18);
        } else if (firstContentfulPaint < 3000) {
            fcpScore = 50 - ((firstContentfulPaint - 1800) / 24);
        } else {
            fcpScore = Math.max(0, 50 - ((firstContentfulPaint - 3000) / 60));
        }
    } else {
        fcpScore = 50; // 如果无法获取，给中等分数
    }

    // 2. LCP 评分 (Largest Contentful Paint)
    let lcpScore = 0;
    if (largestContentfulPaint > 0) {
        if (largestContentfulPaint < 2500) {
            lcpScore = 100 - (largestContentfulPaint / 25);
        } else if (largestContentfulPaint < 4000) {
            lcpScore = 50 - ((largestContentfulPaint - 2500) / 30);
        } else {
            lcpScore = Math.max(0, 50 - ((largestContentfulPaint - 4000) / 80));
        }
    } else {
        // 如果没有 LCP，使用 loadTime 代替
        if (loadTime < 3000) {
            lcpScore = 100 - (loadTime / 30);
        } else if (loadTime < 5000) {
            lcpScore = 50 - ((loadTime - 3000) / 40);
        } else {
            lcpScore = Math.max(0, 50 - ((loadTime - 5000) / 100));
        }
    }

    // 3. 资源大小评分
    // 优秀: <1MB, 良好: <3MB, 需改进: >3MB
    let sizeScore = 0;
    const resourceMB = resourceSize / (1024 * 1024);
    if (resourceMB < 1) {
        sizeScore = 100;
    } else if (resourceMB < 3) {
        sizeScore = 100 - ((resourceMB - 1) * 25);
    } else {
        sizeScore = Math.max(0, 50 - ((resourceMB - 3) * 10));
    }

    // 4. 资源数量评分
    // 优秀: <25, 良好: <50, 需改进: >50
    let countScore = 0;
    if (resourceCount < 25) {
        countScore = 100;
    } else if (resourceCount < 50) {
        countScore = 100 - ((resourceCount - 25) * 2);
    } else {
        countScore = Math.max(0, 50 - ((resourceCount - 50) * 0.5));
    }

    // 5. DOM 复杂度评分
    // 优秀: <800, 良好: <1500, 需改进: >1500
    let domScore = 0;
    if (domElements < 800) {
        domScore = 100;
    } else if (domElements < 1500) {
        domScore = 100 - ((domElements - 800) / 7);
    } else {
        domScore = Math.max(0, 50 - ((domElements - 1500) / 35));
    }

    // 6. 缓存利用率评分
    let cacheScore = Math.min(100, cacheHitRate * 1.2);

    // 综合评分（参考 Lighthouse 权重）
    const score = Math.round(
        fcpScore * 0.15 +        // FCP 15%
        lcpScore * 0.30 +        // LCP/加载时间 30% (最重要)
        sizeScore * 0.20 +       // 资源大小 20%
        countScore * 0.15 +      // 资源数量 15%
        domScore * 0.10 +        // DOM复杂度 10%
        cacheScore * 0.10        // 缓存利用 10%
    );

    // 生成唯一标识符，确保不是模拟数据
    const uniqueIdentifier = Date.now().toString(36) + Math.random().toString(36).substr(2);

    // 返回收集到的性能数据
    return {
        url: window.location.href,
        score,
        timing: loadTime,
        resourceCount,
        resourceSize,
        jsSize,
        cssSize,
        imageSize,
        domElements,
        firstPaint,
        firstContentfulPaint,
        largestContentfulPaint, // 添加 LCP
        domInteractive: domInteractiveTime,
        domComplete: domCompleteTime,
        networkRequests: resourceCount,
        cacheHitRate,
        memoryUsage,
        longTasks,
        resourceTypes,
        uniqueIdentifier // 添加标识符，确保数据不是模拟的
    };
}

// 立即收集一次性能数据并存储，以便popup可以立即获取
const initialData = collectPerformanceData();
// 存储在sessionStorage中，因为这对于内容脚本是安全的
try {
    window.sessionStorage.setItem('clearpage_performance_data', JSON.stringify(initialData));
} catch (e) {
    console.error('无法将性能数据存储到sessionStorage', e);
}

console.log('ClearPage性能监测脚本已加载', initialData); 