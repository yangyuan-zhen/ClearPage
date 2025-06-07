import React, { useState, useEffect } from "react";
import { useI18n } from "../utils/i18n";
import { clearDomainCache } from "../utils/cacheUtils";
import {
  getSmartCleaningRecommendations,
  getCleaningAdvice,
} from "../utils/cleaningRecommendations";
import {
  clearIndexedDB,
  clearSessionStorage,
  clearWebSQL,
  clearFormData,
  clearFileSystem,
} from "@/utils";

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
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>([
    "cache",
    "cookies",
  ]);
  const [recommendations, setRecommendations] = useState<DataType[]>([]);
  const [cleaningAdvice, setCleaningAdvice] = useState<string>("");
  const [showRecommendations, setShowRecommendations] = useState<boolean>(true);
  const [isRecommendationApplied, setIsRecommendationApplied] =
    useState<boolean>(false);
  const [isCleaningComplete, setIsCleaningComplete] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"standard" | "smart">("smart");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true); // 是否自动刷新页面

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

  // 检查选择是否与推荐一致
  const checkIfRecommendationApplied = (
    selected: DataType[],
    recommended: DataType[]
  ): boolean => {
    if (recommended.length === 0) {
      return false;
    }
    return (
      recommended.every((type) => selected.includes(type)) &&
      selected.every((type) => recommended.includes(type))
    );
  };

  // 当选择改变时检查是否与推荐一致
  useEffect(() => {
    if (recommendations.length > 0) {
      setIsRecommendationApplied(
        checkIfRecommendationApplied(selectedTypes, recommendations)
      );
    }
  }, [selectedTypes, recommendations]);

  // 获取当前域名
  useEffect(() => {
    const getCurrentTab = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) {
        const url = new URL(tab.url);
        setCurrentDomain(url.hostname);
        // 获取智能清理建议
        getRecommendationsForDomain(url.hostname);
      }
    };

    getCurrentTab();
  }, []);

  // 为指定域名获取推荐
  const getRecommendationsForDomain = (domain: string) => {
    try {
      // 使用现有的推荐系统获取清理建议
      const smartRecommendations = getSmartCleaningRecommendations(domain);
      setRecommendations(smartRecommendations);

      // 获取适合当前域名的清理建议说明文本
      const advice = getCustomCleaningAdvice(domain, smartRecommendations);
      setCleaningAdvice(advice);

      // 确保至少包含基本缓存
      if (!smartRecommendations.includes("cache")) {
        smartRecommendations.push("cache");
      }

      console.log("为", domain, "生成智能清理建议：", smartRecommendations);

      // 自动应用智能建议到复选框选择中
      setSelectedTypes([...smartRecommendations]);
      // 设置推荐已应用的状态
      setIsRecommendationApplied(true);
    } catch (error) {
      console.error("生成智能建议失败", error);
      // 出错时设置默认值
      setRecommendations(["cache", "cookies"]);

      // 设置默认的清理建议文本
      setCleaningAdvice(
        currentLang === "zh_CN"
          ? "已为您选择基本的缓存和Cookies清理。"
          : "Basic cache and cookies cleaning has been selected for you."
      );
    }
  };

  // 自定义清理建议文本，确保多语言支持
  const getCustomCleaningAdvice = (
    domain: string,
    recommendedTypes: DataType[]
  ): string => {
    // 视频网站
    if (
      domain.includes("youtube") ||
      domain.includes("bilibili") ||
      domain.includes("iqiyi") ||
      domain.includes("netflix")
    ) {
      return currentLang === "zh_CN"
        ? "视频网站通常缓存大量媒体文件，清理这些缓存可以释放大量存储空间。"
        : "Video sites typically cache large media files. Cleaning these caches can free up significant storage space.";
    }

    // 社交媒体网站
    if (
      domain.includes("weibo") ||
      domain.includes("facebook") ||
      domain.includes("twitter") ||
      domain.includes("instagram")
    ) {
      return currentLang === "zh_CN"
        ? "社交媒体网站存储了大量的个人信息和浏览历史，清理这些数据有助于保护您的隐私并释放存储空间。"
        : "Social media sites store a lot of personal information and browsing history. Cleaning this data helps protect your privacy and free up storage space.";
    }

    // 购物网站
    if (
      domain.includes("amazon") ||
      domain.includes("taobao") ||
      domain.includes("jd") ||
      domain.includes("tmall")
    ) {
      return currentLang === "zh_CN"
        ? "已保留购物网站的登录状态，仅清理不必要的缓存数据以加快页面加载速度。"
        : "Login state for shopping sites has been preserved, only clearing unnecessary cache data to speed up page loading.";
    }

    // 默认建议
    const typesCount = recommendedTypes.length;
    return currentLang === "zh_CN"
      ? `根据分析，建议清理该网站的${typesCount}种数据类型，这将有助于提升浏览性能和保护隐私。`
      : `Based on analysis, it's recommended to clean ${typesCount} types of data from this site, which will help improve browsing performance and protect privacy.`;
  };

  // 监听语言变化，更新清理建议文本
  useEffect(() => {
    if (currentDomain && recommendations.length > 0) {
      // 当语言变化时，重新生成清理建议文本
      const advice = getCustomCleaningAdvice(currentDomain, recommendations);
      setCleaningAdvice(advice);
    }
  }, [currentLang, currentDomain, recommendations]);

  // 处理数据类型选择
  const handleTypeSelect = (type: DataType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // 应用推荐
  const applyRecommendations = () => {
    if (recommendations.length > 0) {
      // 重置所有选择，然后应用建议
      setSelectedTypes([...recommendations]);

      // 显示应用成功的反馈
      const successMessage =
        currentLang === "zh_CN"
          ? "已应用建议的数据类型"
          : "Recommended data types applied";

      // 创建临时消息提示
      const oldMessage = message;
      setMessage(successMessage);
      setTimeout(() => {
        // 如果消息未被其他操作更改，则清空它
        setMessage((currentMsg) =>
          currentMsg === successMessage ? "" : currentMsg
        );
      }, 2000);

      // 设置推荐已应用的状态
      setIsRecommendationApplied(true);
    }
  };

  // 处理数据清理
  const handleClearCache = async () => {
    if (selectedTypes.length === 0) {
      setMessage(
        currentLang === "zh_CN"
          ? "请至少选择一种数据类型"
          : "Please select at least one data type"
      );
      return;
    }

    setIsLoading(true);
    setMessage(currentLang === "zh_CN" ? "正在清理..." : "Cleaning...");
    setIsCleaningComplete(false);
    setClearTime(null);

    try {
      const startTime = performance.now();

      // 使用一个请求清理所有选中的缓存类型
      const result = await clearDomainCache({
        domain: currentDomain,
        dataTypes: selectedTypes as any, // 临时类型转换，因为 DataType 在这个组件中是 string 类型
        autoRefresh: autoRefresh, // 添加自动刷新选项
      });

      // 处理需要自定义处理的类型
      for (const dataType of selectedTypes) {
        // 这些类型已经在clearDomainCache中处理过了
        if (["cache", "cookies", "localStorage"].includes(dataType)) {
          continue;
        }

        // 处理其他特殊类型
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
          default:
            console.warn(`未知的数据类型: ${dataType}`);
        }
      }

      // 如果已经自动刷新了，添加到消息中
      if (result?.refreshedCount && result.refreshedCount > 0) {
        console.log(`已自动刷新 ${result.refreshedCount} 个标签页`);
      }

      const endTime = performance.now();
      setClearTime(Math.round(endTime - startTime));
      setIsCleaningComplete(true);

      // 清理完成后的消息
      setMessage(
        currentLang === "zh_CN"
          ? "清理成功！页面数据已被清除。"
          : "Cleaned successfully! Page data has been cleared."
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

  // 切换显示/隐藏推荐
  const toggleRecommendations = () => {
    setShowRecommendations((prev) => !prev);
  };

  // 选择所有或基本类型
  const handleSelectAll = (isBasic = false) => {
    if (isBasic) {
      // 基本类型: 缓存和cookies
      setSelectedTypes(["cache", "cookies"]);
    } else {
      // 全选
      setSelectedTypes(dataTypeOptions.map((opt) => opt.value));
    }
  };

  // 根据当前域名获取可读性更好的网站名称
  const getFriendlySiteName = (domain: string): string => {
    if (!domain) return currentLang === "zh_CN" ? "当前网站" : "Current site";

    // 移除www.前缀和子域名
    const baseDomain = domain
      .replace(/^www\./, "")
      .split(".")
      .slice(-2)
      .join(".");

    // 添加网站名称映射
    const siteNameMap: Record<string, string> = {
      "google.com": "Google",
      "facebook.com": "Facebook",
      "youtube.com": "YouTube",
      "amazon.com": "Amazon",
    };

    return siteNameMap[baseDomain] || baseDomain;
  };

  // 修复智能清理标签文本
  const standardLabel = t("advancedCleaning", "高级清理");
  const smartLabel = t("smartCleaning", "智能清理");

  return (
    <div className="p-3 relative overflow-hidden">
      {/* 网站信息和清理状态 - 减小内边距和外边距 */}
      <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center text-blue-700 overflow-hidden">
        <div className="mr-2 text-xl">ℹ️</div>
        <div className="flex-1 truncate">
          {t("cleaning_data_for", "正在清理数据：")}{" "}
          <strong>{getFriendlySiteName(currentDomain)}</strong>
        </div>
      </div>

      {/* 标签切换 - 减小下边距 */}
      <div className="mb-2 border-b border-gray-200 overflow-hidden">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-3 rounded-t-lg ${
                activeTab === "smart"
                  ? "active text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("smart")}
            >
              {smartLabel}
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-3 rounded-t-lg ${
                activeTab === "standard"
                  ? "active text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("standard")}
            >
              {standardLabel}
            </button>
          </li>
        </ul>
      </div>

      {/* 标签内容 */}
      {activeTab === "smart" ? (
        <div
          className="smart-cleaning-panel overflow-hidden"
          key={`smart-panel-${currentLang}`}
        >
          {/* 智能清理说明 - 减小内外边距 */}
          <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center mb-1">
              <span className="text-base mr-1 flex-shrink-0">💡</span>
              <h3 className="font-semibold text-sm truncate">
                {t("smart_recommendation", "智能推荐")}
              </h3>
              <button
                className="ml-auto text-blue-600 text-xs hover:underline flex-shrink-0"
                onClick={toggleRecommendations}
              >
                {showRecommendations ? t("hide", "隐藏") : t("show", "显示")}
              </button>
            </div>

            {/* 自动刷新开关 */}
            <div className="flex items-center mt-2 p-1 border-t border-gray-100">
              <input
                type="checkbox"
                id="auto-refresh"
                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <label
                htmlFor="auto-refresh"
                className="ml-2 text-xs text-gray-700"
              >
                {t("auto_refresh", "清理后自动刷新页面")}
              </label>
              <div className="ml-auto">
                <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                  {autoRefresh
                    ? t("enabled", "已启用")
                    : t("disabled", "已禁用")}
                </span>
              </div>
            </div>

            {showRecommendations && (
              <div
                className="text-gray-600 text-xs mt-1 overflow-hidden"
                key={`advice-${currentLang}`}
              >
                <p className="break-words">{cleaningAdvice}</p>
              </div>
            )}
          </div>

          {/* 建议选中的数据类型 - 减小外边距和内部间距 */}
          <div
            className="mb-3 overflow-hidden"
            key={`recommended-types-${currentLang}`}
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-medium text-gray-700 text-sm truncate">
                {t("recommended_data_types", "建议清理的数据类型")}
              </h3>
              <button
                className={`text-xs flex-shrink-0 ${
                  isRecommendationApplied
                    ? "text-green-600"
                    : "text-blue-600 hover:underline"
                }`}
                onClick={applyRecommendations}
                disabled={isRecommendationApplied}
              >
                {isRecommendationApplied
                  ? t("recommendation_applied", "已应用")
                  : t("apply_recommendation", "应用建议")}
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-1 overflow-hidden">
              {/* 只显示推荐的数据类型 */}
              {dataTypeOptions
                .filter((option) => recommendations.includes(option.value))
                .map((option) => (
                  <div key={option.value}>
                    <label
                      htmlFor={`smart-${option.value}`}
                      className={`flex p-1.5 px-2.5 rounded-full text-xs cursor-pointer transition-colors whitespace-nowrap ${
                        selectedTypes.includes(option.value)
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${
                        recommendations.includes(option.value)
                          ? "border border-blue-300"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`smart-${option.value}`}
                        value={option.value}
                        checked={selectedTypes.includes(option.value)}
                        onChange={() => handleTypeSelect(option.value)}
                        className="sr-only"
                      />
                      <span>{option.label}</span>
                      {recommendations.includes(option.value) && (
                        <span className="ml-1 text-blue-700">✓</span>
                      )}
                    </label>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="standard-cleaning-panel overflow-hidden">
          {/* 高级清理数据类型选择 */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-medium text-gray-700 text-sm truncate">
                {t("select_data_types", "选择要清理的数据类型")}
              </h3>
              <div className="flex-shrink-0">
                <button
                  className="text-xs text-blue-600 hover:underline mr-2"
                  onClick={() => handleSelectAll(true)}
                >
                  {t("select_basic", "选择基本项")}
                </button>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => handleSelectAll(false)}
                >
                  {t("select_all", "全选")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-2 overflow-hidden">
              {dataTypeOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-2 rounded-lg border ${
                    selectedTypes.includes(option.value)
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={selectedTypes.includes(option.value)}
                      onChange={() => handleTypeSelect(option.value)}
                      className="mt-0.5 h-3 w-3 text-blue-600 rounded flex-shrink-0"
                    />
                    <div className="ml-2 min-w-0">
                      <div className="font-medium text-xs truncate">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 break-words">
                        {option.description}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 清理按钮部分 - 减小上边距 */}
      <div className="mt-3 flex flex-col overflow-hidden">
        {/* 结果或警告消息 */}
        {message && (
          <div
            className={`mb-2 p-2 rounded-lg text-sm overflow-hidden ${
              message.includes("成功") || message.includes("success")
                ? "bg-green-100 text-green-800"
                : message.includes("错误") || message.includes("error")
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            <p className="break-words">{message}</p>
          </div>
        )}

        {/* 敏感数据提示 - 减小外边距和内边距 */}
        {hasSensitiveData && !isCleaningComplete && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs overflow-hidden">
            <div className="flex items-start">
              <span className="text-sm mr-1 flex-shrink-0">⚠️</span>
              <p className="break-words">
                {t(
                  "sensitive_data_warning",
                  "您选择了包含敏感数据的类型。清理后可能需要重新登录此网站。"
                )}
              </p>
            </div>
          </div>
        )}

        {/* 操作结果展示 - 减小外边距和内边距 */}
        {isCleaningComplete && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg overflow-hidden">
            <div className="flex items-center text-green-800">
              <span className="text-sm mr-1 flex-shrink-0">✅</span>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {t("cleaning_complete", "清理完成")}
                </p>
                <p className="text-xs mt-0.5 break-words">
                  {t("selected_data_cleared", "已清理所选数据类型")}
                  {clearTime && (
                    <span className="ml-1">
                      ({t("time_taken", "耗时")}: {clearTime.toFixed(2)}ms)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 清理按钮 */}
        <button
          className={`w-full py-2.5 rounded-lg font-medium ${
            isLoading
              ? "bg-gray-300 cursor-not-allowed"
              : isCleaningComplete
              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          onClick={handleClearCache}
          disabled={isLoading || selectedTypes.length === 0}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
              {t("cleaning", "正在清理...")}
            </div>
          ) : isCleaningComplete ? (
            t("clearAgain", "再次清理")
          ) : activeTab === "smart" ? (
            t("clearWithSmart", "智能清理")
          ) : (
            t("startCleaning", "开始清理")
          )}
        </button>
      </div>
    </div>
  );
};

export default CacheClearButton;
