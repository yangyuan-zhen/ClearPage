export interface PagePerformance {
    dnsTime: number;          // DNS 解析时间
    tcpTime: number;          // TCP 连接时间
    requestTime: number;      // 请求响应时间
    domTime: number;          // DOM 解析时间
    loadTime: number;         // 页面加载总时间
    resourceCount: number;    // 资源数量
    resourceSize: number;     // 资源总大小（KB）
}

/**
 * 获取页面性能数据
 * @returns Promise<PagePerformance>
 */
export const getPagePerformance = async (): Promise<PagePerformance> => {
    try {
        // 注入脚本到当前页面获取性能数据
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.id) throw new Error('无法获取当前标签页');

        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                const resources = performance.getEntriesByType('resource');

                return {
                    dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
                    tcpTime: timing.connectEnd - timing.connectStart,
                    requestTime: timing.responseEnd - timing.requestStart,
                    domTime: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
                    loadTime: timing.loadEventEnd - timing.startTime,
                    resourceCount: resources.length,
                    resourceSize: resources.reduce((total, resource) =>
                        total + ((resource as PerformanceResourceTiming).transferSize || 0), 0) / 1024
                };
            }
        });

        return result[0].result;
    } catch (error) {
        console.error('获取性能数据失败:', error);
        throw error;
    }
}; 