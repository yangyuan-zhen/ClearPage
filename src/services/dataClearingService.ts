import { DataType } from '../types';
import { logPageRefresh } from './logService';

/**
 * 数据清理服务
 * 处理所有与浏览数据清理相关的操作
 */

/**
 * 配置项接口
 */
interface ClearingOptions {
    domain?: string;
    since?: number;
    batchSize?: number;
    batchDelay?: number;
    autoRefresh?: boolean;
}

// 默认配置项
const DEFAULT_OPTIONS: Required<ClearingOptions> = {
    domain: '',
    since: 0,
    batchSize: 2,
    batchDelay: 50,
    autoRefresh: true
};

/**
 * 清理数据类型映射表
 * 将DataType映射到browsingData API支持的类型
 */
interface DataTypeMap {
    [key: string]: {
        isOriginBased: boolean; // 是否支持基于域名的清理
        browsingDataKey: keyof chrome.browsingData.DataTypeSet; // Chrome API 使用的键名
        requiresCustomClean?: boolean; // 是否需要自定义清理逻辑
    };
}

// 数据类型映射表定义
const DATA_TYPE_MAP: DataTypeMap = {
    cache: { isOriginBased: false, browsingDataKey: 'cache' },
    cookies: { isOriginBased: true, browsingDataKey: 'cookies' },
    localStorage: { isOriginBased: true, browsingDataKey: 'localStorage' },
    serviceWorkers: { isOriginBased: false, browsingDataKey: 'serviceWorkers' },
    indexedDB: { isOriginBased: false, browsingDataKey: 'indexedDB' },
    webSQL: { isOriginBased: false, browsingDataKey: 'webSQL' },
    formData: { isOriginBased: false, browsingDataKey: 'formData' },
    fileSystem: { isOriginBased: false, browsingDataKey: 'fileSystems' },
    sessionStorage: {
        isOriginBased: false,
        browsingDataKey: 'cache', // 临时使用cache键名，但实际上会通过requiresCustomClean标记使用自定义逻辑
        requiresCustomClean: true
    }
};

/**
 * 清理结果接口
 */
export interface ClearingResult {
    success: boolean;
    timeUsed?: number;
    error?: string;
    refreshedCount?: number; // 记录刷新的标签页数量
}

/**
 * 清理浏览器数据
 * @param dataTypes 要清理的数据类型
 * @param options 清理选项
 * @returns 清理结果
 */
export async function clearBrowserData(
    dataTypes: DataType[],
    options: ClearingOptions = {}
): Promise<ClearingResult> {
    const startTime = Date.now();
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const { domain, since, batchSize, batchDelay, autoRefresh } = mergedOptions;

    try {
        // 分离支持域名过滤和不支持域名过滤的类型
        const originBasedTypes = dataTypes.filter(type => DATA_TYPE_MAP[type]?.isOriginBased);
        const globalTypes = dataTypes.filter(type => !DATA_TYPE_MAP[type]?.isOriginBased);

        const clearResults: Promise<any>[] = [];

        // 处理支持域名过滤的类型
        if (originBasedTypes.length > 0) {
            await processDataTypesBatches(originBasedTypes, true, clearResults, {
                domain, since, batchSize, batchDelay, autoRefresh
            });
        }

        // 处理全局类型（不支持域名过滤）
        if (globalTypes.length > 0) {
            await processDataTypesBatches(globalTypes, false, clearResults, {
                domain, since, batchSize, batchDelay, autoRefresh
            });
        }

        // 等待所有清理任务完成
        await Promise.all(clearResults);

        // 如果启用了自动刷新，并且提供了域名，则刷新相关页面
        let refreshedCount = 0;
        if (autoRefresh && domain) {
            refreshedCount = await refreshMatchingTabs(domain);
        }

        return {
            success: true,
            timeUsed: Date.now() - startTime,
            refreshedCount
        };
    } catch (error) {
        console.error("清理数据失败:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "未知错误",
            timeUsed: Date.now() - startTime
        };
    }
}

/**
 * 批量处理数据类型清理
 * @param types 数据类型数组
 * @param isOriginBased 是否基于域名
 * @param results 结果数组
 * @param options 清理选项
 */
async function processDataTypesBatches(
    types: DataType[],
    isOriginBased: boolean,
    results: Promise<any>[],
    options: Required<ClearingOptions>
): Promise<void> {
    const { domain, since, batchSize, batchDelay, autoRefresh } = options;

    // 将数据类型分批处理
    for (let i = 0; i < types.length; i += batchSize) {
        const batch = types.slice(i, i + batchSize);

        const removalOptions: chrome.browsingData.RemovalOptions = {
            since: since,
            // 仅在基于域名且提供了域名时设置origins
            origins: isOriginBased && domain && !domain.includes('*')
                ? [`https://${domain}`, `http://${domain}`]
                : undefined
        };

        const dataTypeOptions: chrome.browsingData.DataTypeSet = {};

        // 构建数据类型选项
        batch.forEach(type => {
            const typeInfo = DATA_TYPE_MAP[type];
            if (typeInfo && !typeInfo.requiresCustomClean) {
                dataTypeOptions[typeInfo.browsingDataKey] = true;
            }

            // 处理需要自定义处理的类型
            if (typeInfo?.requiresCustomClean) {
                // 这里可以添加自定义处理逻辑
                // 例如：处理sessionStorage等Chrome API不直接支持的类型
            }
        });

        // 如果有需要清理的数据类型，则添加到结果数组
        if (Object.keys(dataTypeOptions).length > 0) {
            const batchPromise = chrome.browsingData.remove(removalOptions, dataTypeOptions);
            results.push(batchPromise);
        }

        // 添加批次间的延迟
        if (i + batchSize < types.length) {
            await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
    }
}

/**
 * 清理规则接口
 */
export interface CleaningRule {
    id: string;
    name: string;
    domain: string;
    dataTypes: DataType[];
    isEnabled: boolean;
    isAutomatic: boolean;
    frequency?: "daily" | "weekly" | "monthly";
    lastCleanTime?: number;
}

/**
 * 从存储中加载清理规则
 * @returns 清理规则数组
 */
export async function loadRules(): Promise<CleaningRule[]> {
    const data = await chrome.storage.sync.get("cleaningRules");
    return data.cleaningRules || [];
}

/**
 * 保存规则到存储
 * @param rules 清理规则数组
 */
export async function saveRules(rules: CleaningRule[]): Promise<void> {
    await chrome.storage.sync.set({ cleaningRules: rules });
}

/**
 * 刷新匹配特定域名的所有标签页
 * @param domain 要匹配的域名
 * @returns 刷新的标签页数量
 */
export async function refreshMatchingTabs(domain: string): Promise<number> {
    try {
        // 查询匹配域名的标签页
        const tabs = await chrome.tabs.query({});
        let refreshedCount = 0;

        // 遍历所有标签页
        for (const tab of tabs) {
            // 确保标签页有URL
            if (tab.url && tab.id) {
                try {
                    // 创建URL对象以解析域名
                    const tabUrl = new URL(tab.url);

                    // 域名匹配逻辑
                    if (domain.includes('*')) {
                        // 通配符匹配
                        const domainPattern = domain.replace(/\*/g, '.*');
                        const regex = new RegExp(`^(?:https?:\/\/)?(${domainPattern})`, 'i');
                        if (regex.test(tabUrl.hostname)) {
                            await chrome.tabs.reload(tab.id);
                            refreshedCount++;
                        }
                    } else {
                        // 精确匹配
                        if (tabUrl.hostname === domain ||
                            tabUrl.hostname === `www.${domain}` ||
                            `www.${tabUrl.hostname}` === domain) {
                            await chrome.tabs.reload(tab.id);
                            refreshedCount++;
                        }
                    }
                } catch (err) {
                    console.error(`刷新标签页错误:`, err);
                }
            }
        }

        // 使用专用日志函数记录刷新事件
        logPageRefresh(domain, refreshedCount);
        return refreshedCount;
    } catch (error) {
        console.error('刷新标签页时出错:', error);
        logPageRefresh(domain, 0);
        return 0;
    }
} 