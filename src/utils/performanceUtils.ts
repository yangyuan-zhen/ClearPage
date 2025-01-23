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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) throw new Error('无法获取当前标签页');
        if (!tab.url?.startsWith('http')) throw new Error('只能检测网页性能');

        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'MAIN',
            func: () => {
                const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                if (!nav) throw new Error('无法获取网页性能数据');

                const resources = performance.getEntriesByType('resource');
                if (!resources) throw new Error('无法获取资源性能数据');

                return {
                    dnsTime: nav.domainLookupEnd - nav.domainLookupStart,
                    tcpTime: nav.connectEnd - nav.connectStart,
                    requestTime: nav.responseEnd - nav.requestStart,
                    domTime: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
                    loadTime: nav.loadEventEnd - nav.startTime,
                    resourceCount: resources.length,
                    resourceSize: resources.reduce((total, resource) =>
                        total + ((resource as PerformanceResourceTiming).transferSize || 0), 0) / 1024
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