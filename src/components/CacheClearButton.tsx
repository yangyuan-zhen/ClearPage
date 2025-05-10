import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
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
  // 使用语言上下文
  const { t, currentLang } = useLanguage();

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
      const advice = getCleaningAdvice(domain, smartRecommendations);
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
        currentLang === "zh-CN"
          ? "已为您选择基本的缓存和Cookies清理。"
          : "Basic cache and cookies cleaning has been selected for you."
      );
    }
  };

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
        currentLang === "zh-CN"
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
        currentLang === "zh-CN"
          ? "请至少选择一种数据类型"
          : "Please select at least one data type"
      );
      return;
    }

    setIsLoading(true);
    setMessage(currentLang === "zh-CN" ? "正在清理..." : "Cleaning...");
    setIsCleaningComplete(false);
    setClearTime(null);

    try {
      const startTime = performance.now();

      // 依次清理每种类型的数据
      for (const dataType of selectedTypes) {
        switch (dataType) {
          case "cache":
          case "cookies":
          case "localStorage":
            await clearDomainCache({
              domain: currentDomain,
              dataTypes: [dataType],
            });
            break;
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

      const endTime = performance.now();
      setClearTime(Math.round(endTime - startTime));
      setIsCleaningComplete(true);

      // 清理完成后的消息
      setMessage(
        currentLang === "zh-CN"
          ? "清理成功！页面数据已被清除。"
          : "Cleaned successfully! Page data has been cleared."
      );
    } catch (error) {
      console.error("清理缓存失败", error);
      setMessage(
        currentLang === "zh-CN"
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
    if (!domain) return currentLang === "zh-CN" ? "当前网站" : "Current site";

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

  return (
    <div className="space-y-6">
      {/* 页面上下文信息 */}
      <div className="flex items-center p-4 text-blue-800 bg-blue-50 rounded-lg">
        <svg
          className="mr-2 w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>
          {currentLang === "zh-CN"
            ? `正在清理 ${getFriendlySiteName(currentDomain)} 的数据`
            : `Cleaning data for ${getFriendlySiteName(currentDomain)}`}
        </p>
      </div>

      {/* 选择模式标签页 */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("smart")}
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === "smart"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {t("smartCleaning", "智能清理")}
          </button>
          <button
            onClick={() => setActiveTab("standard")}
            className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === "standard"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {t("advancedCleaning", "高级清理")}
          </button>
        </nav>
      </div>

      {/* 智能清理模式 */}
      {activeTab === "smart" && (
        <div className="space-y-4">
          {/* 智能推荐区域 */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-blue-800">
                {t("smartRecommendations", "智能推荐")}
              </h3>
              <button
                onClick={toggleRecommendations}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showRecommendations
                  ? t("hideDetails", "隐藏详情")
                  : t("showDetails", "显示详情")}
              </button>
            </div>

            {showRecommendations && (
              <>
                <p className="mb-3 text-sm text-blue-700">{cleaningAdvice}</p>

                <div className="p-3 bg-white bg-opacity-60 rounded-md">
                  <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase">
                    {t("recommendedTypes", "建议清理的数据类型")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-full"
                      >
                        {dataTypeOptions.find((opt) => opt.value === type)
                          ?.label || type}
                      </span>
                    ))}
                  </div>
                </div>

                {!isRecommendationApplied && (
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={applyRecommendations}
                      className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {t("applyRecommendations", "应用建议")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 智能清理按钮 */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleClearCache}
              disabled={isLoading || selectedTypes.length === 0}
              className={`w-full max-w-xs py-3 px-4 rounded-lg flex items-center justify-center transition-colors ${
                isLoading
                  ? "text-gray-200 bg-gray-400 cursor-not-allowed"
                  : isCleaningComplete
                  ? "text-white bg-green-500 hover:bg-green-600"
                  : "text-white bg-primary hover:bg-primary-dark"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="mr-2 -ml-1 w-4 h-4 text-white animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("cleaning", "正在清理...")}
                </>
              ) : isCleaningComplete ? (
                <>
                  <svg
                    className="mr-2 -ml-1 w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("clearAgain", "再次清理")}
                </>
              ) : (
                t("clearWithSmart", "智能清理")
              )}
            </button>
          </div>
        </div>
      )}

      {/* 自定义清理模式 */}
      {activeTab === "standard" && (
        <div className="space-y-4">
          {/* 快速选择按钮 */}
          <div className="flex mb-2 space-x-2">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              {t("basicCleaning", "基础清理")}
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll()}
              className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              {t("selectAll", "全选")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypes([])}
              className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              {t("clearSelection", "清除选择")}
            </button>
          </div>

          {/* 数据类型选择网格 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dataTypeOptions.map(({ value, label, description }) => (
              <div
                key={value}
                className={`border rounded-lg p-3 transition-colors ${
                  selectedTypes.includes(value)
                    ? "border-primary bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(value)}
                    onChange={() => handleTypeSelect(value)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="ml-2">
                    <div className="font-medium text-gray-800">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* 清理按钮 */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleClearCache}
              disabled={isLoading || selectedTypes.length === 0}
              className={`w-full max-w-xs py-3 px-4 rounded-lg flex items-center justify-center ${
                isLoading
                  ? "text-gray-200 bg-gray-400 cursor-not-allowed"
                  : isCleaningComplete
                  ? "text-white bg-green-500 hover:bg-green-600"
                  : "text-white bg-primary hover:bg-primary-dark"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="mr-2 -ml-1 w-4 h-4 text-white animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("cleaning", "正在清理...")}
                </>
              ) : isCleaningComplete ? (
                <>
                  <svg
                    className="mr-2 -ml-1 w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("clearAgain", "再次清理")}
                </>
              ) : (
                t("startCleaning", "开始清理")
              )}
            </button>
          </div>
        </div>
      )}

      {/* 清理结果消息 */}
      {(message || clearTime !== null) && (
        <div
          className={`mt-3 p-3 rounded-lg ${
            isCleaningComplete
              ? "text-green-800 bg-green-50 border border-green-100"
              : "text-blue-800 bg-blue-50 border border-blue-100"
          }`}
        >
          <p className="text-sm">{message}</p>
          {clearTime !== null && (
            <p className="mt-1 text-xs text-gray-500">
              {currentLang === "zh-CN"
                ? `耗时: ${clearTime} 毫秒`
                : `Time taken: ${clearTime} ms`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CacheClearButton;
