import React, { useState, useEffect } from "react";
import { useI18n } from "../utils/i18n";
import { clearDomainCache } from "../utils/cacheUtils";
import {
  clearIndexedDB,
  clearSessionStorage,
  clearWebSQL,
  clearFormData,
  clearFileSystem,
} from "@/utils";
import { shouldPreserveCookies } from "../utils/smartCleanUtils";

// 已有类型的定义
type DataType = string;

const CacheClearButton: React.FC = () => {
  // 使用i18n钩子
  const { t, currentLang } = useI18n();

  // 状态管理
  const [currentDomain, setCurrentDomain] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [clearTime, setClearTime] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>(["cache"]);
  const [isCleaningComplete, setIsCleaningComplete] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [autoWhitelistApplied, setAutoWhitelistApplied] = useState<boolean>(false);

  // 数据类型选项
  const dataTypeOptions: {
    value: DataType;
    label: string;
    description: string;
  }[] = [
    {
      value: "cache",
      label: t("cache", "缓存"),
      description: t("cacheDescription", "临时存储的页面资源和文件"),
    },
    {
      value: "cookies",
      label: t("cookies", "Cookies"),
      description: t("cookiesDescription", "网站存储的用户识别和偏好数据"),
    },
    {
      value: "localStorage",
      label: t("localStorage", "本地存储"),
      description: t("localStorageDescription", "永久存储的网站数据"),
    },
    {
      value: "sessionStorage",
      label: t("sessionStorage", "会话存储"),
      description: t(
        "sessionStorageDescription",
        "临时会话数据，关闭标签页后清除"
      ),
    },
    {
      value: "indexedDB",
      label: t("indexedDB", "IndexedDB"),
      description: t("indexedDBDescription", "结构化数据存储"),
    },
    {
      value: "webSQL",
      label: t("webSQL", "WebSQL"),
      description: t("webSQLDescription", "旧版网站使用的数据库存储"),
    },
    {
      value: "formData",
      label: t("formData", "表单数据"),
      description: t("formDataDescription", "保存的表单数据"),
    },
    {
      value: "fileSystem",
      label: t("fileSystem", "文件系统"),
      description: t("fileSystemDescription", "网站保存的文件"),
    },
  ];

  // 敏感数据类型
  const sensitiveDataTypes: DataType[] = [
    "cookies",
    "localStorage",
    "indexedDB",
  ];

  // 检查是否有敏感数据
  const hasSensitiveData = selectedTypes.some((type) =>
    sensitiveDataTypes.includes(type)
  );

  // 获取当前域名和预估空间
  useEffect(() => {
    const getCurrentTab = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) {
        const url = new URL(tab.url);
        setCurrentDomain(url.hostname);
      }
    };

    // 加载白名单
    const loadWhitelist = async () => {
      const data = await chrome.storage.sync.get("cookieWhitelist");
      setWhitelist(data.cookieWhitelist || []);
    };

    getCurrentTab();
    loadWhitelist();
  }, []);

  useEffect(() => {
    if (currentDomain && !autoWhitelistApplied) {
      if (shouldPreserveCookies(currentDomain) && !whitelist.includes(currentDomain)) {
        const newList = [...whitelist, currentDomain];
        setWhitelist(newList);
        chrome.storage.sync.set({ cookieWhitelist: newList });
      }
      setAutoWhitelistApplied(true);
    }
  }, [currentDomain, whitelist, autoWhitelistApplied]);

  // 预估可释放的存储空间
  const estimateClearingSize = () => {
    let estimatedBytes = 0;

    if (selectedTypes.includes("cache")) {
      estimatedBytes += 50 * 1024 * 1024; // 缓存 ~50MB
    }
    if (selectedTypes.includes("cookies") && !isInWhitelist) {
      estimatedBytes += 500 * 1024; // Cookies ~500KB
    }
    if (selectedTypes.includes("localStorage")) {
      estimatedBytes += 5 * 1024 * 1024; // localStorage ~5MB
    }
    if (selectedTypes.includes("indexedDB")) {
      estimatedBytes += 20 * 1024 * 1024; // IndexedDB ~20MB
    }
    if (selectedTypes.includes("sessionStorage")) {
      estimatedBytes += 2 * 1024 * 1024; // sessionStorage ~2MB
    }

    setEstimatedSize(estimatedBytes);
  };

  // 当选择改变时重新估算
  useEffect(() => {
    estimateClearingSize();
  }, [selectedTypes, whitelist]);

  // 处理数据类型选择
  const handleTypeSelect = (type: DataType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // 处理数据清理（实际执行）
  const executeClearing = async () => {
    setIsLoading(true);
    setMessage(currentLang === "zh_CN" ? "正在清理..." : "Cleaning...");
    setIsCleaningComplete(false);
    setClearTime(null);
    setShowConfirm(false);

    try {
      const startTime = performance.now();

      // 使用一个请求清理所有选中的缓存类型
      const result = await clearDomainCache({
        domain: currentDomain,
        dataTypes: selectedTypes as any,
        autoRefresh: autoRefresh,
        whitelist: whitelist, // 传递白名单
      });

      // 处理需要自定义处理的类型
      for (const dataType of selectedTypes) {
        if (["cache", "cookies", "localStorage"].includes(dataType)) {
          continue;
        }

        switch (dataType) {
          case "indexedDB":
            await clearIndexedDB(currentDomain);
            break;
          case "sessionStorage":
            await clearSessionStorage(currentDomain);
            break;
          case "webSQL":
            await clearWebSQL(currentDomain);
            break;
          case "formData":
            await clearFormData(currentDomain);
            break;
          case "fileSystem":
            await clearFileSystem(currentDomain);
            break;
        }
      }

      const endTime = performance.now();
      const timeUsed = Math.round(endTime - startTime);
      setClearTime(timeUsed);
      setIsCleaningComplete(true);

      // 清理完成后的消息
      setMessage(
        currentLang === "zh_CN"
          ? `清理成功！已释放约 ${formatBytes(estimatedSize)} 空间`
          : `Cleaned successfully! Freed approximately ${formatBytes(
              estimatedSize
            )}`
      );
    } catch (error) {
      console.error("清理缓存失败", error);
      setMessage(
        currentLang === "zh_CN"
          ? "清理过程中出错，请重试。"
          : "Error during cleaning process. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 处理清理按钮点击
  const handleClearCache = async () => {
    if (selectedTypes.length === 0) {
      setMessage(
        currentLang === "zh_CN"
          ? "请至少选择一种数据类型"
          : "Please select at least one data type"
      );
      return;
    }

    // 如果有敏感数据且不在白名单中，显示确认对话框
    if (hasSensitiveData && !isInWhitelist) {
      setShowConfirm(true);
    } else {
      executeClearing();
    }
  };

  // 选择所有或基本类型
  const handleSelectAll = (isBasic = false) => {
    if (isBasic) {
      setSelectedTypes(["cache", "cookies"]);
    } else {
      setSelectedTypes(dataTypeOptions.map((opt) => opt.value));
    }
  };

  // 根据当前域名获取可读性更好的网站名称
  const getFriendlySiteName = (domain: string): string => {
    if (!domain) return currentLang === "zh_CN" ? "当前网站" : "Current site";

    const baseDomain = domain
      .replace(/^www\./, "")
      .split(".")
      .slice(-2)
      .join(".");

    const siteNameMap: Record<string, string> = {
      "google.com": "Google",
      "facebook.com": "Facebook",
      "youtube.com": "YouTube",
      "amazon.com": "Amazon",
      "bilibili.com": "哔哩哔哩",
    };

    return siteNameMap[baseDomain] || baseDomain;
  };

  // 格式化文件大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // 切换白名单
  const toggleWhitelist = async (domain: string) => {
    const newWhitelist = whitelist.includes(domain)
      ? whitelist.filter((d) => d !== domain)
      : [...whitelist, domain];

    setWhitelist(newWhitelist);
    await chrome.storage.sync.set({ cookieWhitelist: newWhitelist });
  };

  // 检查当前域名是否在白名单中
  const isInWhitelist = whitelist.includes(currentDomain);

  return (
    <div className="overflow-hidden relative p-4">
      {/* 网站信息卡片 */}
      <div className="p-4 mb-4 card">
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-1 items-center truncate">
            <span className="mr-3 text-2xl">🌐</span>
            <div className="truncate">
              <h3 className="font-semibold text-blue-900">
                {getFriendlySiteName(currentDomain)}
              </h3>
              <p className="text-xs text-blue-700 truncate">{currentDomain}</p>
            </div>
          </div>

          {/* 白名单保护按钮 */}
          {selectedTypes.includes("cookies") && (
            <button
              onClick={() => toggleWhitelist(currentDomain)}
              className={`ml-3 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md ${
                isInWhitelist
                  ? "text-white bg-green-500 hover:bg-green-600 hover:shadow-lg"
                  : "text-gray-700 bg-white border-2 border-gray-300 hover:border-green-500 hover:bg-green-50"
              }`}
            >
              <span className="text-lg">🛡️</span>
              <span>
                {isInWhitelist
                  ? t("protected", "已保护")
                  : t("protect_login", "保护登录")}
              </span>
            </button>
          )}
        </div>

        {/* 预估释放空间 */}
        <div className="flex justify-between items-center pt-3 border-t border-blue-200">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-blue-700">
              📊 {t("will_free_space", "将释放约")}:
            </span>
            <span className="text-lg font-bold text-blue-900">
              {formatBytes(estimatedSize)}
            </span>
          </div>

          {isInWhitelist && (
            <div className="flex gap-2 items-center px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg border border-border">
              <svg
                className="flex-shrink-0 w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {t("login_protected_desc", "登录已保护，清理时将保留 Cookies")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 确认对话框 */}
      {showConfirm && (
        <div className="p-4 mb-4 bg-orange-50 rounded-lg border-l-4 border-orange-500 shadow-md">
          <div className="flex items-start mb-3">
            <span className="flex-shrink-0 mr-2 text-2xl">⚠️</span>
            <div className="flex-1">
              <h4 className="mb-1 font-semibold text-orange-900">
                {t("confirm_cleaning", "确认清理")}
              </h4>
              <p className="text-sm leading-relaxed text-orange-800">
                {t(
                  "confirm_sensitive_data",
                  "您即将清理包含敏感数据的内容，这可能导致您需要重新登录此网站。确定要继续吗？"
                )}
              </p>
              {!isInWhitelist && (
                <p className="mt-2 text-xs text-orange-700">
                  {t(
                    "suggest_whitelist",
                    "建议将当前站点加入白名单以保护登录状态"
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={executeClearing}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {t("confirm", "确认清理")}
            </button>
            {!isInWhitelist && (
              <button
                onClick={async () => {
                  await toggleWhitelist(currentDomain);
                  executeClearing();
                }}
                className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                {t("protect_and_continue", "加入白名单并继续")}
              </button>
            )}
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              {t("cancel", "取消")}
            </button>
          </div>
        </div>
      )}

      {/* 消息提示 */}
      {message && !showConfirm && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm overflow-hidden border-l-4 shadow-sm transition-all duration-200 ${
            message.includes("成功") || message.includes("success")
              ? "bg-green-50 text-green-800 border-green-500"
              : message.includes("错误") || message.includes("error")
              ? "bg-red-50 text-red-800 border-red-500"
              : "bg-blue-50 text-blue-800 border-blue-500"
          }`}
        >
          <p className="leading-relaxed break-words">{message}</p>
        </div>
      )}

      {/* 主清理按钮 - 放在顶部 */}
      <button
        className={`w-full btn-primary py-4 rounded-xl font-bold text-base mb-4 ${
          selectedTypes.length === 0 && !isLoading
            ? "opacity-50 cursor-not-allowed"
            : ""
        } ${isLoading ? "cursor-not-allowed" : ""}`}
        onClick={handleClearCache}
        disabled={isLoading || selectedTypes.length === 0}
      >
        {isLoading ? (
          <div className="flex justify-center items-center">
            <div className="mr-2 w-6 h-6 rounded-full border-t-2 border-b-2 border-white animate-spin"></div>
            <span>{t("cleaning", "正在清理...")}</span>
          </div>
        ) : isCleaningComplete ? (
          <div className="flex justify-center items-center">
            <span className="mr-2 text-xl">✅</span>
            <div className="text-left">
              <div>{t("cleaning_complete", "清理完成")}</div>
              {clearTime && (
                <div className="text-xs font-normal opacity-90">
                  {t("time_taken", "耗时")}: {clearTime}ms
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center">
            <span className="mr-2 text-xl">🚀</span>
            <span>{t("start_cleaning_now", "立即清理")}</span>
          </div>
        )}
      </button>

      {/* 快捷选择按钮组 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleSelectAll(true)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            selectedTypes.length === 2 &&
            selectedTypes.includes("cache") &&
            selectedTypes.includes("cookies")
              ? "bg-accent text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <div className="flex gap-1 justify-center items-center">
            <span>⚡</span>
            <span>{t("quick_clean", "快速清理")}</span>
          </div>
        </button>
        <button
          onClick={() => handleSelectAll(false)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            selectedTypes.length === dataTypeOptions.length
              ? "bg-accent text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <div className="flex gap-1 justify-center items-center">
            <span>💪</span>
            <span>{t("deep_clean", "深度清理")}</span>
          </div>
        </button>
      </div>

      {/* 高级选项 - 可折叠 */}
      <div className="mb-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex justify-between items-center p-3 w-full bg-gray-50 rounded-lg border border-gray-200 transition-colors duration-200 hover:bg-gray-100"
        >
          <span className="flex gap-2 items-center text-sm font-medium text-gray-700">
            <span>⚙️</span>
            <span>{t("advanced_options", "高级选项")}</span>
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              showAdvanced ? "transform rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* 展开的高级选项 */}
        {showAdvanced && (
          <div className="mt-3 space-y-3">
            {/* 自动刷新开关 */}
            <div className="p-3 card">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  className="w-4 h-4 text-blue-600 rounded transition duration-150 ease-in-out cursor-pointer"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <label
                  htmlFor="auto-refresh"
                  className="flex-1 ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {t("auto_refresh_current", "清理后自动刷新当前页面")}
                </label>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-200 ${
                    autoRefresh
                      ? "text-green-800 bg-green-100"
                      : "text-gray-600 bg-gray-100"
                  }`}
                >
                  {autoRefresh
                    ? t("enabled", "已启用")
                    : t("disabled", "已禁用")}
                </span>
              </div>
            </div>

            {/* 数据类型选择 */}
            <div className="p-3 card">
              <h4 className="flex gap-2 items-center mb-3 text-sm font-semibold text-gray-800">
                <span>📋</span>
                <span>
                  {t("selected_data_types", "已选择的数据类型")} (
                  {selectedTypes.length})
                </span>
              </h4>

              <div className="flex flex-wrap gap-2">
                {dataTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleTypeSelect(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                      selectedTypes.includes(option.value)
                        ? "bg-green-500 text-white shadow-md transform scale-105"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                    }`}
                  >
                    {selectedTypes.includes(option.value) && "✓ "}
                    {option.label}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                💡 {t("tip_click_to_toggle", "点击数据类型标签即可切换选择")}
              </p>
              {(selectedTypes.includes("cache") ||
                selectedTypes.includes("indexedDB") ||
                selectedTypes.includes("webSQL") ||
                selectedTypes.includes("fileSystem")) && (
                <div className="p-2 mt-2 text-xs text-amber-800 bg-amber-100 rounded-md border border-amber-200">
                  {t(
                    "global_clean_warning",
                    "提示：部分数据类型可能执行全局清理并影响其他网站（如 缓存/IndexedDB/WebSQL/文件系统）"
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 性能提示 */}
      {!isCleaningComplete && (
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex gap-2 items-start">
            <span className="flex-shrink-0 text-lg">💡</span>
            <div className="flex-1 text-xs leading-relaxed text-purple-900">
              <p className="mb-1 font-medium">
                {t("performance_tip", "性能提示")}
              </p>
              <p className="text-purple-800">
                {t(
                  "check_performance_info",
                  "清理后可前往【性能检测】查看页面性能改善情况，帮助您了解浏览器速度提升效果。"
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheClearButton;
