// 导入服务模块
import {
    clearBrowserData,
    loadRules,
    saveRules,
    CleaningRule as ClearRule,
    getPagePerformanceMetrics,
    configureLogger,
    info,
    warn,
    error,
    LogLevel,
    Timer,
    initializeServices
} from './services';
import { DataType } from './types';

// 初始化和配置服务
initializeServices();

// 配置日志服务
configureLogger({
    logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    enableConsole: true
});

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
    info('Cache Clearer 插件已安装');

    // 不需要重复注册内容脚本，已在manifest.json中声明
    // chrome.scripting.registerContentScripts 可能会与manifest中的声明冲突
});

// 检查并运行自动清理规则
async function checkAndRunAutomaticRules(): Promise<void> {
    try {
        const rules = await loadRules();
        const now = Date.now();
        const automaticRules = rules.filter(rule => rule.isEnabled && rule.isAutomatic);

        for (const rule of automaticRules) {
            // 检查是否需要执行清理
            if (shouldRunCleaningRule(rule, now)) {
                info(`运行自动清理规则: ${rule.name}`);

                // 执行清理
                const timer = new Timer(`清理规则: ${rule.name}`);
                const result = await clearBrowserData(rule.dataTypes, {
                    domain: rule.domain,
                    autoRefresh: true // 启用自动刷新
                });
                const elapsed = timer.stop();

                if (result.success) {
                    info(`自动清理完成: ${rule.name}`, { timeUsed: elapsed });

                    // 更新上次清理时间
                    rule.lastCleanTime = now;
                    await saveRules(rules);
                } else {
                    error(`自动清理失败: ${rule.name}`, result.error);
                }
            }
        }
    } catch (err) {
        error('执行自动清理规则时出错', err);
    }
}

/**
 * 判断是否应该执行清理规则
 * @param rule 清理规则
 * @param currentTime 当前时间戳
 * @returns 是否应该执行
 */
function shouldRunCleaningRule(rule: ClearRule, currentTime: number): boolean {
    // 如果没有设置上次清理时间，则应该执行
    if (!rule.lastCleanTime) return true;

    const lastCleanTime = rule.lastCleanTime;
    const timeDiff = currentTime - lastCleanTime;

    // 根据频率确定是否执行
    switch (rule.frequency) {
        case 'daily':
            return timeDiff >= 24 * 60 * 60 * 1000; // 24小时
        case 'weekly':
            return timeDiff >= 7 * 24 * 60 * 60 * 1000; // 7天
        case 'monthly':
            return timeDiff >= 30 * 24 * 60 * 60 * 1000; // 30天
        default:
            return false;
    }
}

// 定期检查自动规则
setInterval(checkAndRunAutomaticRules, 60 * 60 * 1000); // 每小时检查一次

// 启动时也检查一次
checkAndRunAutomaticRules();

// 监听消息
chrome.runtime.onMessage.addListener((
    request: {
        type?: string;
        action?: string;
        payload?: {
            domain: string;
            dataTypes: DataType[];
            since?: number;
            autoRefresh?: boolean;
        };
        tabId?: number;
    },
    sender,
    sendResponse
) => {
    // 清理缓存请求
    if (request.type === 'CLEAR_CACHE') {
        const { domain, dataTypes, since, autoRefresh = true } = request.payload || { domain: '', dataTypes: [], since: 0, autoRefresh: true };

        info('收到清理缓存请求', { domain, dataTypes, autoRefresh });

        // 记录开始时间并执行清理
        const timer = new Timer('缓存清理');

        // 异步执行清理任务
        clearBrowserData(dataTypes, { domain, since, autoRefresh }).then(async result => {
            const elapsed = timer.stop();

            if (result.success) {
                info('清理缓存完成，自动刷新相关页面', {
                    timeUsed: elapsed,
                    refreshedCount: result.refreshedCount || 0
                });
            } else {
                error('清理缓存失败', result.error);
            }

            sendResponse({
                success: result.success,
                timeUsed: elapsed,
                error: result.error,
                refreshed: result.refreshedCount && result.refreshedCount > 0,
                refreshedCount: result.refreshedCount || 0
            });
        });

        // 返回true表示稍后会调用sendResponse
        return true;
    }

    // 获取性能数据请求
    if (request.action === "getPerformanceData") {
        const targetTabId = request.tabId;

        if (!targetTabId) {
            sendResponse({ success: false, error: "无效的标签页ID" });
            return true;
        }

        info('收到获取性能数据请求', { tabId: targetTabId });

        // 获取性能数据并响应
        getPagePerformanceMetrics(targetTabId)
            .then(metrics => {
                if (metrics) {
                    sendResponse({ success: true, data: metrics });
                } else {
                    sendResponse({ success: false, error: "无法获取性能数据" });
                }
            })
            .catch(err => {
                error('获取性能数据失败', err);
                sendResponse({
                    success: false,
                    error: err instanceof Error ? err.message : "未知错误"
                });
            });

        // 返回true表示稍后会调用sendResponse
        return true;
    }

    // 其他消息类型
    return false;
});