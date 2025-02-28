// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('Cache Clearer 插件已安装');
});

// 监听消息
chrome.runtime.onMessage.addListener((
    request: { type: string; payload: { domain: string; dataTypes: string[]; since?: number } },
    sender,
    sendResponse
) => {
    if (request.type === 'CLEAR_CACHE') {
        const { domain, dataTypes, since } = request.payload;

        // 定义支持域名过滤的类型
        const originSupportedTypes = ['cookies', 'localStorage'];
        const originFiltered = dataTypes.filter(type => originSupportedTypes.includes(type));

        // 定义不支持域名过滤的类型（需全局清除）
        const globalTypes = ['cache', 'serviceWorkers'];
        const globalFiltered = dataTypes.filter(type => globalTypes.includes(type));

        const clearTasks = [];

        // 处理支持域名过滤的类型
        if (originFiltered.length > 0) {
            const removalOptions: chrome.browsingData.RemovalOptions = {
                since: since || 0,
                origins: domain ? [`https://${domain}`, `http://${domain}`] : undefined
            };

            const dataTypeOptions: chrome.browsingData.DataTypeSet = {
                cookies: originFiltered.includes('cookies'),
                localStorage: originFiltered.includes('localStorage'),
            };

            clearTasks.push(chrome.browsingData.remove(removalOptions, dataTypeOptions));
        }

        // 处理不支持域名过滤的类型（全局清除）
        if (globalFiltered.length > 0) {
            const globalRemovalOptions: chrome.browsingData.RemovalOptions = {
                since: since || 0
            };

            const globalDataTypeOptions: chrome.browsingData.DataTypeSet = {
                cache: globalFiltered.includes('cache'),
                serviceWorkers: globalFiltered.includes('serviceWorkers')
            };

            clearTasks.push(
                chrome.browsingData.remove(globalRemovalOptions, globalDataTypeOptions)
            );
        }

        // 等待所有任务完成
        Promise.all(clearTasks)
            .then(() => {
                sendResponse({ success: true });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }
});