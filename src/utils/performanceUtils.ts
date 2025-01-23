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
            world: 'ISOLATED',
            func: () => {
                const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                if (!nav) throw new Error('无法获取网页性能数据');

                // 获取所有资源性能数据
                const allResources = [
                    ...(performance.getEntriesByType('navigation') as PerformanceResourceTiming[]),
                    ...(performance.getEntriesByType('resource') as PerformanceResourceTiming[])
                ];

                // 只统计从服务器实际传输的资源（不包括从浏览器缓存加载的资源）
                const validResources = allResources.filter(r => r.transferSize > 0);

                // 计算实际从服务器传输的总大小
                const totalSize = validResources.reduce((total, resource) => {
                    return total + resource.transferSize;  // transferSize 为资源的实际传输大小
                }, 0);

                return {
                    dnsTime: nav.domainLookupEnd - nav.domainLookupStart,
                    tcpTime: nav.connectEnd - nav.connectStart,
                    requestTime: nav.responseEnd - nav.requestStart,
                    domTime: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
                    loadTime: nav.loadEventEnd - nav.startTime,
                    resourceCount: validResources.length,  // 实际从服务器加载的资源数量
                    resourceSize: totalSize / 1024  // 转换为 KB
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