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
  initializeServices,
} from "./services";
import { DataType } from "./types";

// 初始化和配置服务
initializeServices();

// 配置日志服务
configureLogger({
  logLevel: LogLevel.INFO,
  enableConsole: true,
});

// 清理规则接口定义（仅用于手动清理）
interface CleaningRule {
  id: string;
  name: string;
  domain: string;
  dataTypes: DataType[];
  isEnabled: boolean;
}

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  info("Cache Clearer 插件已安装");

  // 不需要重复注册内容脚本，已在manifest.json中声明
  // chrome.scripting.registerContentScripts 可能会与manifest中的声明冲突
});

// 监听消息
chrome.runtime.onMessage.addListener(
  (
    request: {
      type?: string;
      action?: string;
      payload?: {
        domain: string;
        dataTypes: DataType[];
        since?: number;
        autoRefresh?: boolean;
        whitelist?: string[];
      };
      tabId?: number;
    },
    sender,
    sendResponse
  ) => {
    // 清理缓存请求
    if (request.type === "CLEAR_CACHE") {
      const {
        domain,
        dataTypes,
        since,
        autoRefresh = false,
        whitelist = [],
      } = request.payload || {
        domain: "",
        dataTypes: [],
        since: 0,
        autoRefresh: false,
        whitelist: [],
      };

      info("收到清理缓存请求", { domain, dataTypes, autoRefresh, whitelist });

      // 记录开始时间并执行清理
      const timer = new Timer("缓存清理");

      // 异步执行清理任务
      clearBrowserData(dataTypes, { domain, since, autoRefresh, whitelist }).then(
        async (result) => {
          const elapsed = timer.stop();

          if (result.success) {
            info("清理缓存完成，自动刷新相关页面", {
              timeUsed: elapsed,
              refreshedCount: result.refreshedCount || 0,
            });
          } else {
            error("清理缓存失败", result.error);
          }

          sendResponse({
            success: result.success,
            timeUsed: elapsed,
            error: result.error,
            refreshed: result.refreshedCount && result.refreshedCount > 0,
            refreshedCount: result.refreshedCount || 0,
          });
        }
      );

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

      info("收到获取性能数据请求", { tabId: targetTabId });

      // 获取性能数据并响应
      getPagePerformanceMetrics(targetTabId)
        .then((metrics) => {
          if (metrics) {
            sendResponse({ success: true, data: metrics });
          } else {
            sendResponse({ success: false, error: "无法获取性能数据" });
          }
        })
        .catch((err) => {
          error("获取性能数据失败", err);
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : "未知错误",
          });
        });

      // 返回true表示稍后会调用sendResponse
      return true;
    }

    // 其他消息类型
    return false;
  }
);
