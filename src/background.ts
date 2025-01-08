// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('Cache Clearer 插件已安装');
});

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CLEAR_CACHE') {
        const { domain, dataTypes, since } = request.payload;

        const removalOptions: chrome.browsingData.RemovalOptions = {
            since: since || 0,
            origins: domain ? [`https://${domain}`, `http://${domain}`] : undefined
        };

        const dataTypeOptions: chrome.browsingData.DataTypeSet = {
            cache: dataTypes.includes('cache'),
            cookies: dataTypes.includes('cookies'),
            downloads: dataTypes.includes('downloads'),
            fileSystems: dataTypes.includes('fileSystems'),
            formData: dataTypes.includes('formData'),
            history: dataTypes.includes('history'),
            indexedDB: dataTypes.includes('indexedDB'),
            localStorage: dataTypes.includes('localStorage'),
            passwords: dataTypes.includes('passwords'),
            serviceWorkers: dataTypes.includes('serviceWorkers'),
            webSQL: dataTypes.includes('webSQL')
        };

        chrome.browsingData.remove(removalOptions, dataTypeOptions)
            .then(() => {
                console.log('缓存清理成功');
                sendResponse({ success: true });
            })
            .catch((error) => {
                console.error('缓存清理失败:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // 保持消息通道开放
    }
}); 