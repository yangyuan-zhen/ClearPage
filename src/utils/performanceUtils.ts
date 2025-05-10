export interface PagePerformance {
    dnsTime: number;          // DNS 解析时间
    tcpTime: number;          // TCP 连接时间
    requestTime: number;      // 请求响应时间
    domTime: number;          // DOM 解析时间
    loadTime: number;         // 页面加载总时间
    resourceCount: number;    // 资源数量
    resourceSize: number;     // 资源总大小（KB）
    jsExecutionTime: number;  // JavaScript 执行时间
    cssParsingTime: number;   // CSS 解析时间
    firstContentfulPaint: number; // 首次内容绘制时间
    largestContentfulPaint: number; // 最大内容绘制时间
    firstInputDelay: number;  // 首次输入延迟
    cumulativeLayoutShift: number; // 累积布局偏移
    cachedResourceCount: number; // 缓存资源数量
    networkResourceCount: number; // 网络资源数量
}

/**
 * 获取页面性能数据
 * @returns Promise<PagePerformance>
 */
export const getPagePerformance = async (): Promise<PagePerformance> => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) throw new Error('无法获取当前标签页');
        if (!tab.url?.startsWith('http')) throw new Error('只能检测网页性能');

        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'ISOLATED',
            func: () => {
                const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                if (!nav) throw new Error('无法获取网页性能数据');

                // 获取所有资源性能数据
                const allResources = [
                    ...(performance.getEntriesByType('navigation') as PerformanceResourceTiming[]),
                    ...(performance.getEntriesByType('resource') as PerformanceResourceTiming[])
                ];

                // 分析资源类型
                const resourcesByType: Record<string, PerformanceResourceTiming[]> = {};
                const networkResources: PerformanceResourceTiming[] = [];
                const cachedResources: PerformanceResourceTiming[] = [];

                allResources.forEach(resource => {
                    // 按资源类型分类
                    const url = resource.name;
                    let type = 'other';

                    if (url.endsWith('.js')) type = 'script';
                    else if (url.endsWith('.css')) type = 'style';
                    else if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)/i)) type = 'image';
                    else if (url.match(/\.(woff|woff2|ttf|otf)/i)) type = 'font';

                    if (!resourcesByType[type]) resourcesByType[type] = [];
                    resourcesByType[type].push(resource);

                    // 区分缓存和网络资源
                    if (resource.transferSize > 0) {
                        networkResources.push(resource);
                    } else {
                        cachedResources.push(resource);
                    }
                });

                // 计算JS执行时间
                const scriptResources = resourcesByType['script'] || [];
                const jsExecutionTime = scriptResources.reduce((total, resource) => {
                    // 脚本下载后到执行完成的时间
                    const executionTime = resource.responseEnd > 0 ?
                        resource.duration - (resource.responseEnd - resource.startTime) : 0;
                    return total + executionTime;
                }, 0);

                // 计算CSS解析时间
                const styleResources = resourcesByType['style'] || [];
                const cssParsingTime = styleResources.reduce((total, resource) => {
                    // CSS下载后到解析完成的时间
                    const parsingTime = resource.responseEnd > 0 ?
                        resource.duration - (resource.responseEnd - resource.startTime) : 0;
                    return total + parsingTime;
                }, 0);

                // 计算实际从服务器传输的总大小
                const totalSize = networkResources.reduce((total, resource) => {
                    return total + resource.transferSize;  // transferSize 为资源的实际传输大小
                }, 0);

                // 获取Web Vitals指标
                let firstContentfulPaint = 0;
                let largestContentfulPaint = 0;
                let firstInputDelay = 0;
                let cumulativeLayoutShift = 0;

                // 获取FCP
                const paintEntries = performance.getEntriesByType('paint');
                const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
                if (fcpEntry) {
                    firstContentfulPaint = fcpEntry.startTime;
                }

                // 尝试获取LCP、FID和CLS (如果浏览器支持)
                if (window.PerformanceObserver && 'supportedEntryTypes' in PerformanceObserver) {
                    const supportedTypes = PerformanceObserver.supportedEntryTypes;

                    // 获取LCP
                    if (supportedTypes.includes('largest-contentful-paint')) {
                        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
                        if (lcpEntries.length > 0) {
                            largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
                        }
                    }

                    // 获取FID
                    if (supportedTypes.includes('first-input')) {
                        const fidEntries = performance.getEntriesByType('first-input');
                        if (fidEntries.length > 0) {
                            // 添加类型断言，因为PerformanceEntry没有processingStart属性
                            const entry = fidEntries[0] as any;
                            firstInputDelay = entry.processingStart - entry.startTime;
                        }
                    }

                    // 获取CLS
                    if (supportedTypes.includes('layout-shift')) {
                        const clsEntries = performance.getEntriesByType('layout-shift');
                        cumulativeLayoutShift = clsEntries.reduce((total, entry: any) => {
                            return total + (entry.value || 0);
                        }, 0);
                    }
                }

                return {
                    dnsTime: nav.domainLookupEnd - nav.domainLookupStart,
                    tcpTime: nav.connectEnd - nav.connectStart,
                    requestTime: nav.responseEnd - nav.requestStart,
                    domTime: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
                    loadTime: nav.loadEventEnd - nav.startTime,
                    resourceCount: allResources.length,
                    resourceSize: totalSize / 1024,  // 转换为 KB
                    jsExecutionTime,
                    cssParsingTime,
                    firstContentfulPaint,
                    largestContentfulPaint,
                    firstInputDelay,
                    cumulativeLayoutShift,
                    cachedResourceCount: cachedResources.length,
                    networkResourceCount: networkResources.length
                };
            }
        });

        if (!result?.[0]?.result) throw new Error('执行脚本失败');
        return result[0].result;
    } catch (error) {
        console.error('获取性能数据失败:', error);
        throw error;
    }
}; 