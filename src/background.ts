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

        const clearTasks = [];

        // 处理支持域名过滤的类型
        if (originFiltered.length > 0) {
            const removalOptions: chrome.browsingData.RemovalOptions = {
                since: 0,
                origins: domain.includes('*')
                    ? undefined
                    : [`https://${domain}`, `http://${domain}`]
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
                since: 0
            };

            const globalDataTypeOptions: chrome.browsingData.DataTypeSet = {
                cache: globalFiltered.includes('cache'),
                serviceWorkers: globalFiltered.includes('serviceWorkers'),
                indexedDB: globalFiltered.includes('indexedDB'),
                webSQL: globalFiltered.includes('webSQL'),
                formData: globalFiltered.includes('formData'),
                fileSystems: globalFiltered.includes('fileSystem')
            };

            clearTasks.push(
                chrome.browsingData.remove(globalRemovalOptions, globalDataTypeOptions)
            );
        }

        // 使用 Promise.all 并行处理不同类型的清除任务
        await Promise.all(clearTasks);
        return true;
    } catch (error) {
        console.error("清理数据失败:", error);
        return false;
    }
};

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
        const globalTypes = ['cache', 'serviceWorkers', 'indexedDB', 'sessionStorage', 'webSQL', 'formData', 'fileSystem'];
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
                serviceWorkers: globalFiltered.includes('serviceWorkers'),
                indexedDB: globalFiltered.includes('indexedDB'),
                webSQL: globalFiltered.includes('webSQL'),
                formData: globalFiltered.includes('formData'),
                fileSystems: globalFiltered.includes('fileSystem')
            };

            clearTasks.push(
                chrome.browsingData.remove(globalRemovalOptions, globalDataTypeOptions)
            );
        }

        // 记录开始时间
        const startTime = Date.now();

        // 使用 Promise.all 并行处理不同类型的清除任务
        Promise.all(clearTasks)
            .then(() => {
                sendResponse({ success: true, timeUsed: Date.now() - startTime });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }
});