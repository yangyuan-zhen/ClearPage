// 导入类型
import { DataType } from './types';

// 清理规则接口定义
interface CleaningRule {
    id: string;
    name: string;
    domain: string;
    dataTypes: DataType[];
    isEnabled: boolean;
    isAutomatic: boolean;
    frequency?: "daily" | "weekly" | "monthly";
    lastCleanTime?: number;
}

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('Cache Clearer 插件已安装');

    // 不需要重复注册内容脚本，已在manifest.json中声明
    // chrome.scripting.registerContentScripts 可能会与manifest中的声明冲突
});

// 从存储中加载清理规则
const loadRules = async (): Promise<CleaningRule[]> => {
    const data = await chrome.storage.sync.get("cleaningRules");
    return data.cleaningRules || [];
};

// 保存规则到存储
const saveRules = async (rules: CleaningRule[]): Promise<void> => {
    await chrome.storage.sync.set({ cleaningRules: rules });
};

// 清理指定域名的数据
const clearDataForDomain = async (domain: string, dataTypes: DataType[]): Promise<boolean> => {
    try {
        // 定义支持域名过滤的类型
        const originSupportedTypes: DataType[] = ['cookies', 'localStorage'];
        const originFiltered = dataTypes.filter(type => originSupportedTypes.includes(type));

        // 定义不支持域名过滤的类型（需全局清除）
        const globalTypes: DataType[] = ['cache', 'serviceWorkers', 'indexedDB', 'sessionStorage', 'webSQL', 'formData', 'fileSystem'];
        const globalFiltered = dataTypes.filter(type => globalTypes.includes(type));

        // 使用批处理方式清理数据，避免一次性处理过多数据导致浏览器卡顿
        const batchSize = 2; // 每批处理的数据类型数量
        const clearResults = [];

        // 处理支持域名过滤的类型（分批处理）
        if (originFiltered.length > 0) {
            // 将数据类型分批
            for (let i = 0; i < originFiltered.length; i += batchSize) {
                const batch = originFiltered.slice(i, i + batchSize);

                const removalOptions: chrome.browsingData.RemovalOptions = {
                    since: 0,
                    origins: domain.includes('*')
                        ? undefined
                        : [`https://${domain}`, `http://${domain}`]
                };

                const dataTypeOptions: chrome.browsingData.DataTypeSet = {};
                batch.forEach(type => {
                    if (type === 'cookies') dataTypeOptions.cookies = true;
                    if (type === 'localStorage') dataTypeOptions.localStorage = true;
                });

                // 使用Promise处理每一批
                const batchPromise = chrome.browsingData.remove(removalOptions, dataTypeOptions);
                clearResults.push(batchPromise);

                // 在批次之间添加短暂延迟，避免浏览器卡顿
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        // 处理不支持域名过滤的类型（分批处理）
        if (globalFiltered.length > 0) {
            // 将数据类型分批
            for (let i = 0; i < globalFiltered.length; i += batchSize) {
                const batch = globalFiltered.slice(i, i + batchSize);

                const globalRemovalOptions: chrome.browsingData.RemovalOptions = {
                    since: 0
                };

                const globalDataTypeOptions: chrome.browsingData.DataTypeSet = {};
                batch.forEach(type => {
                    if (type === 'cache') globalDataTypeOptions.cache = true;
                    if (type === 'serviceWorkers') globalDataTypeOptions.serviceWorkers = true;
                    if (type === 'indexedDB') globalDataTypeOptions.indexedDB = true;
                    if (type === 'webSQL') globalDataTypeOptions.webSQL = true;
                    if (type === 'formData') globalDataTypeOptions.formData = true;
                    if (type === 'fileSystem') globalDataTypeOptions.fileSystems = true;
                    if (type === 'sessionStorage') {
                        // sessionStorage 需要特殊处理，因为Chrome API不直接支持
                        // 这里我们会在后续代码中处理
                    }
                });

                // 使用Promise处理每一批
                const batchPromise = chrome.browsingData.remove(globalRemovalOptions, globalDataTypeOptions);
                clearResults.push(batchPromise);

                // 在批次之间添加短暂延迟，避免浏览器卡顿
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        // 等待所有清理任务完成
        await Promise.all(clearResults);
        return true;
    } catch (error) {
        console.error("清理数据失败:", error);
        return false;
    }
};

// 监听消息
chrome.runtime.onMessage.addListener((
    request: {
        type?: string;
        action?: string;
        payload?: {
            domain: string;
            dataTypes: string[];
            since?: number
        };
        tabId?: number;
    },
    sender,
    sendResponse
) => {
    if (request.type === 'CLEAR_CACHE') {
        const { domain, dataTypes, since } = request.payload || { domain: '', dataTypes: [], since: 0 };

        // 记录开始时间
        const startTime = Date.now();

        // 使用Web Workers处理复杂的清理任务（如果可能的话）
        const processDataClear = async () => {
            try {
                // 定义支持域名过滤的类型
                const originSupportedTypes = ['cookies', 'localStorage'];
                const originFiltered = dataTypes.filter(type => originSupportedTypes.includes(type));

                // 定义不支持域名过滤的类型（需全局清除）
                const globalTypes = ['cache', 'serviceWorkers', 'indexedDB', 'sessionStorage', 'webSQL', 'formData', 'fileSystem'];
                const globalFiltered = dataTypes.filter(type => globalTypes.includes(type));

                // 使用批处理方式清理数据
                const batchSize = 2; // 每批处理的数据类型数量
                const clearResults = [];

                // 处理支持域名过滤的类型（分批处理）
                if (originFiltered.length > 0) {
                    // 将数据类型分批
                    for (let i = 0; i < originFiltered.length; i += batchSize) {
                        const batch = originFiltered.slice(i, i + batchSize);

                        const removalOptions: chrome.browsingData.RemovalOptions = {
                            since: since || 0,
                            origins: domain ? [`https://${domain}`, `http://${domain}`] : undefined
                        };

                        const dataTypeOptions: chrome.browsingData.DataTypeSet = {};
                        batch.forEach(type => {
                            if (type === 'cookies') dataTypeOptions.cookies = true;
                            if (type === 'localStorage') dataTypeOptions.localStorage = true;
                        });

                        // 使用Promise处理每一批
                        const batchPromise = chrome.browsingData.remove(removalOptions, dataTypeOptions);
                        clearResults.push(batchPromise);

                        // 在批次之间添加短暂延迟，避免浏览器卡顿
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                }

                // 处理不支持域名过滤的类型（分批处理）
                if (globalFiltered.length > 0) {
                    // 将数据类型分批
                    for (let i = 0; i < globalFiltered.length; i += batchSize) {
                        const batch = globalFiltered.slice(i, i + batchSize);

                        const globalRemovalOptions: chrome.browsingData.RemovalOptions = {
                            since: since || 0
                        };

                        const globalDataTypeOptions: chrome.browsingData.DataTypeSet = {};
                        batch.forEach(type => {
                            if (type === 'cache') globalDataTypeOptions.cache = true;
                            if (type === 'serviceWorkers') globalDataTypeOptions.serviceWorkers = true;
                            if (type === 'indexedDB') globalDataTypeOptions.indexedDB = true;
                            if (type === 'webSQL') globalDataTypeOptions.webSQL = true;
                            if (type === 'formData') globalDataTypeOptions.formData = true;
                            if (type === 'fileSystem') globalDataTypeOptions.fileSystems = true;
                        });

                        // 使用Promise处理每一批
                        if (Object.keys(globalDataTypeOptions).length > 0) {
                            const batchPromise = chrome.browsingData.remove(globalRemovalOptions, globalDataTypeOptions);
                            clearResults.push(batchPromise);
                        }

                        // 在批次之间添加短暂延迟，避免浏览器卡顿
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                }

                // 等待所有清理任务完成
                await Promise.all(clearResults);

                return { success: true, timeUsed: Date.now() - startTime };
            } catch (error) {
                console.error("清理数据失败:", error);
                return { success: false, error: error instanceof Error ? error.message : "未知错误" };
            }
        };

        // 执行清理并发送响应
        processDataClear().then(sendResponse);

        return true;
    }

    if (request.action === "getPerformanceData") {
        // 转发请求给正确的内容脚本
        const targetTabId = request.tabId;

        if (!targetTabId) {
            sendResponse({ success: false, error: "无效的标签页ID" });
            return true;
        }

        // 转发消息给目标内容脚本
        chrome.tabs.sendMessage(
            targetTabId,
            { action: "getPerformanceData" },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("发送消息到内容脚本失败:", chrome.runtime.lastError);
                    sendResponse({
                        success: false,
                        error: chrome.runtime.lastError.message || "无法与内容脚本通信"
                    });
                    return;
                }

                // 将内容脚本的响应转发回popup
                sendResponse(response);
            }
        );

        return true; // 保持消息通道打开以进行异步响应
    }

    return false; // 如果没有处理消息，返回false
});