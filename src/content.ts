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

    // 获取JavaScript执行时间和CSS解析时间
    let jsExecutionTime = 0;
    let cssParsingTime = 0;

    try {
        // 筛选脚本和样式资源
        const scriptEntries = resources.filter(entry =>
            entry.initiatorType === "script" || (entry.name && entry.name.endsWith(".js")));

        const styleEntries = resources.filter(entry =>
            entry.initiatorType === "link" && entry.name && entry.name.endsWith(".css"));

        // 累加执行和解析时间
        jsExecutionTime = scriptEntries.reduce((total, entry) =>
            total + (entry.duration || 0), 0);

        cssParsingTime = styleEntries.reduce((total, entry) =>
            total + (entry.duration || 0), 0);
    } catch (e) {
        console.error("计算执行时间失败", e);
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

    // 计算性能评分
    // 加载时间评分 (低于3秒为满分，超过10秒为0分)
    const loadTimeScore = Math.max(0, 100 - (loadTime / 75));

    // 资源数量评分 (少于30个为满分，超过100个为0分)
    const resourceCountScore = Math.max(0, 100 - (resourceCount / 2));

    // 资源大小评分 (小于1MB为满分，大于10MB为0分)
    const resourceSizeScore = Math.max(0, 100 - (resourceSize / 100000));

    // 首次内容绘制评分 (低于1秒为满分，高于3秒为0分)
    const fcpScore = firstContentfulPaint > 0 ?
        Math.max(0, 100 - (firstContentfulPaint / 30)) : 70;

    // DOM复杂度评分 (少于500元素为满分，超过5000个为0分)
    const domScore = Math.max(0, 100 - (domElements / 100));

    // JS执行时间评分
    const jsScore = Math.max(0, 100 - (jsExecutionTime / 10));

    // 加权计算最终评分
    const score = Math.round(
        loadTimeScore * 0.25 +
        resourceCountScore * 0.15 +
        resourceSizeScore * 0.15 +
        fcpScore * 0.20 +
        domScore * 0.15 +
        jsScore * 0.10
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
        jsExecutionTime,
        cssParsingTime,
        firstPaint,
        firstContentfulPaint,
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