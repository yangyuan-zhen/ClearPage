import React, { useState, useEffect } from "react";
import { clearDomainCache } from "../utils/cacheUtils";
import {
  getSmartCleaningRecommendations,
  getCleaningAdvice,
} from "../utils/smartCleanUtils";
import { cleanHistoryService } from "../services/historyService";
import type { DataType } from "../types";
import { getMessage } from "../utils/i18n";
import {
  clearIndexedDB,
  clearSessionStorage,
  clearWebSQL,
  clearFormData,
  clearFileSystem,
} from "@/utils";

// 格式化时间间隔的辅助函数
const formatTimeSince = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;

  // 小于1分钟
  if (diffMs < 60 * 1000) {
    return "刚刚";
  }

  // 小于1小时
  if (diffMs < 60 * 60 * 1000) {
    const minutes = Math.floor(diffMs / (60 * 1000));
    return `${minutes}分钟前`;
  }

  // 小于1天
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    return `${hours}小时前`;
  }

  // 小于30天
  if (diffMs < 30 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return `${days}天前`;
  }

  // 30天以上
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const CacheClearButton: React.FC = () => {
  const [currentDomain, setCurrentDomain] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>([
    "cache",
    "cookies",
    "localStorage",
    "indexedDB" as DataType,
    "sessionStorage" as DataType,
    "webSQL" as DataType,
    "formData" as DataType,
    "fileSystem" as DataType,
  ]);
  const [clearTime, setClearTime] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<DataType[]>([]);
  const [cleaningAdvice, setCleaningAdvice] = useState<string>("");
  const [showRecommendations, setShowRecommendations] = useState<boolean>(true);

  // 添加上次清理时间的状态
  const [lastCleanTime, setLastCleanTime] = useState<number | null>(null);
  const [timeSinceLastClean, setTimeSinceLastClean] = useState<string>("");

  // 添加状态标记当前选择是否与推荐一致
  const [isRecommendationApplied, setIsRecommendationApplied] =
    useState<boolean>(false);

  const dataTypeOptions: { value: DataType; label: string }[] = [
    { value: "cache", label: getMessage("cache") },
    { value: "cookies", label: getMessage("cookies") },
    { value: "localStorage", label: getMessage("localStorage") },
    { value: "serviceWorkers", label: getMessage("serviceWorker") },
    {
      value: "indexedDB" as DataType,
      label: getMessage("indexedDB") || "IndexedDB 数据库",
    },
    {
      value: "sessionStorage" as DataType,
      label: getMessage("sessionStorage") || "SessionStorage 会话存储",
    },
    {
      value: "webSQL" as DataType,
      label: getMessage("webSQL") || "WebSQL 数据库",
    },
    {
      value: "formData" as DataType,
      label: getMessage("formData") || "表单数据",
    },
    {
      value: "fileSystem" as DataType,
      label: getMessage("fileSystem") || "文件系统存储",
    },
  ];

  const sensitiveDataTypes: DataType[] = ["cookies", "localStorage"];

  const hasSensitiveData = selectedTypes.some((type) =>
    sensitiveDataTypes.includes(type)
  );

  // 检查选择是否与推荐一致
  const checkIfRecommendationApplied = (
    selected: DataType[],
    recommended: DataType[]
  ) => {
    if (selected.length !== recommended.length) {
      return false;
    }
    // 检查所有推荐的数据类型是否都已选中
    return (
      recommended.every((type) => selected.includes(type)) &&
      // 确保没有选择额外的类型
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
    getCurrentTab();
  }, []);

  useEffect(() => {
    if (!currentDomain) return;

    const getRecommendations = async () => {
      try {
        const history = await cleanHistoryService.getCleanHistory();

        const smartRecommendations = getSmartCleaningRecommendations(
          currentDomain,
          history.map((h) => ({ domain: h.domain, dataTypes: h.dataTypes }))
        );

        // 确保至少包含基本缓存
        if (!smartRecommendations.includes("cache")) {
          smartRecommendations.push("cache");
        }

        setRecommendations(smartRecommendations);
        setCleaningAdvice(
          getCleaningAdvice(currentDomain, smartRecommendations)
        );

        // 自动应用智能建议到复选框选择中
        setSelectedTypes([...smartRecommendations]);
        // 设置推荐已应用的状态
        setIsRecommendationApplied(true);
      } catch (error) {
        console.error("获取智能推荐失败:", error);
      }
    };

    getRecommendations();
  }, [currentDomain]);

  // 添加一个新的useEffect来获取上次清理时间
  useEffect(() => {
    if (!currentDomain) return;

    const getLastCleanTime = async () => {
      try {
        // 获取当前域名的清理历史
        const domainHistory = await cleanHistoryService.getDomainHistory(
          currentDomain
        );

        if (domainHistory.length > 0) {
          // 按时间排序，获取最近一次清理的时间
          const sortedHistory = [...domainHistory].sort(
            (a, b) => b.timestamp - a.timestamp
          );
          const lastClean = sortedHistory[0].timestamp;

          setLastCleanTime(lastClean);
          setTimeSinceLastClean(formatTimeSince(lastClean));
        } else {
          setLastCleanTime(null);
          setTimeSinceLastClean("");
        }
      } catch (error) {
        console.error("获取上次清理时间失败:", error);
      }
    };

    getLastCleanTime();

    // 定时更新时间差显示
    const intervalId = setInterval(() => {
      if (lastCleanTime) {
        setTimeSinceLastClean(formatTimeSince(lastCleanTime));
      }
    }, 60000); // 每分钟更新一次

    return () => clearInterval(intervalId);
  }, [currentDomain, lastCleanTime]);

  const handleTypeChange = (type: DataType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    // 注意：由于 setState 是异步的，状态更新会由上面的 useEffect 处理
  };

  const applyRecommendations = () => {
    if (recommendations.length > 0) {
      // 重置所有选择，然后应用建议
      setSelectedTypes([...recommendations]);

      // 显示应用成功的反馈
      const successMessage = "已应用建议的数据类型";

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

  const handleClearCache = async () => {
    if (hasSensitiveData) {
      const confirmMessage = [
        getMessage("sensitiveDataWarningTitle"),
        selectedTypes
          .filter((type) => sensitiveDataTypes.includes(type))
          .map(
            (type) => dataTypeOptions.find((opt) => opt.value === type)?.label
          )
          .join(", "),
        getMessage("sensitiveDataWarningConsequences"),
        getMessage("loginLoss"),
        getMessage("formDataLoss"),
        getMessage("reloginRequired"),
        getMessage("pageWillRefresh"),
      ].join("\n");

      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setIsLoading(true);
    setMessage("");
    setClearTime(null);

    try {
      const startTime = performance.now();

      const result = await clearDomainCache({
        domain: currentDomain,
        dataTypes: selectedTypes,
      });

      const endTime = performance.now();
      const timeUsed = Math.round(endTime - startTime);
      setClearTime(timeUsed);

      if (result.success) {
        // 保存清理历史
        await cleanHistoryService.saveCleanHistory(
          currentDomain,
          selectedTypes
        );

        // 更新上次清理时间
        const now = Date.now();
        setLastCleanTime(now);
        setTimeSinceLastClean("刚刚");

        setMessage(getMessage("clearSuccess"));

        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (tab?.id) {
          await chrome.tabs.reload(tab.id);
        }

        if (selectedTypes.includes("indexedDB" as DataType)) {
          await clearIndexedDB(currentDomain);
        }
        if (selectedTypes.includes("sessionStorage" as DataType)) {
          await clearSessionStorage(currentDomain);
        }
        if (selectedTypes.includes("webSQL" as DataType)) {
          await clearWebSQL(currentDomain);
        }
        if (selectedTypes.includes("formData" as DataType)) {
          await clearFormData(currentDomain);
        }
        if (selectedTypes.includes("fileSystem" as DataType)) {
          await clearFileSystem(currentDomain);
        }
      } else {
        setMessage(getMessage("clearFailed", [result.error || "未知错误"]));
      }
    } catch (error) {
      console.error("清除失败:", error);
      setMessage(
        `清除失败: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecommendations = () => {
    setShowRecommendations(!showRecommendations);
  };

  // 添加全选/取消全选功能
  const handleSelectAll = (isBasic = false) => {
    if (isBasic) {
      // 选择基本数据类型
      const basicTypes: DataType[] = [
        "cache",
        "cookies",
        "localStorage",
        "serviceWorkers",
      ];
      setSelectedTypes((prev) => {
        const currentBasicSelected = basicTypes.every((type) =>
          prev.includes(type)
        );

        if (currentBasicSelected) {
          // 当前全部已选中，则取消全部选择
          return prev.filter((type) => !basicTypes.includes(type));
        } else {
          // 当前未全部选中，则全部选中
          const newSelected = [...prev];
          basicTypes.forEach((type) => {
            if (!newSelected.includes(type)) {
              newSelected.push(type);
            }
          });
          return newSelected;
        }
      });
    } else {
      // 选择高级数据类型
      const advancedTypes: DataType[] = [
        "indexedDB" as DataType,
        "sessionStorage" as DataType,
        "webSQL" as DataType,
        "formData" as DataType,
        "fileSystem" as DataType,
      ];

      setSelectedTypes((prev) => {
        const currentAdvancedSelected = advancedTypes.every((type) =>
          prev.includes(type)
        );

        if (currentAdvancedSelected) {
          // 当前全部已选中，则取消全部选择
          return prev.filter((type) => !advancedTypes.includes(type));
        } else {
          // 当前未全部选中，则全部选中
          const newSelected = [...prev];
          advancedTypes.forEach((type) => {
            if (!newSelected.includes(type)) {
              newSelected.push(type);
            }
          });
          return newSelected;
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden bg-white rounded-md border shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="p-3 bg-gray-50 border-b dark:bg-gray-900 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">
                {getMessage("currentDomain")}:
              </span>
              <span className="text-sm font-semibold" data-testid="domain-text">
                {currentDomain}
              </span>
            </div>
            {/* 显示上次清理时间 */}
            {timeSinceLastClean && (
              <div className="flex items-center text-xs text-gray-500">
                <svg
                  className="w-3.5 h-3.5 mr-1 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>上次清理: {timeSinceLastClean}</span>
              </div>
            )}
          </div>
        </div>

        {recommendations.length > 0 && (
          <>
            {showRecommendations ? (
              <div className="p-3 bg-blue-50 border-b border-blue-100 dark:bg-blue-950 dark:border-blue-900">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 items-start">
                    <svg
                      className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">
                        {getMessage("cleaningRecommendation")}
                      </p>
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                        {cleaningAdvice}
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label={getMessage("closeRecommendation")}
                    className="p-1 ml-2 text-blue-500 rounded-full transition-colors hover:bg-blue-100 dark:hover:bg-blue-900"
                    onClick={toggleRecommendations}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap items-center mt-3">
                  <button
                    onClick={applyRecommendations}
                    className="px-3 py-1.5 mr-3 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    {getMessage("applyRecommendation")}
                    {isRecommendationApplied && (
                      <span className="ml-1 text-xs bg-blue-500 px-1.5 py-0.5 rounded-full text-white font-normal">
                        已应用
                      </span>
                    )}
                  </button>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {recommendations.map((type) => (
                      <span
                        key={type}
                        className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800"
                      >
                        {dataTypeOptions.find((opt) => opt.value === type)
                          ?.label || type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center p-1 border-b dark:border-gray-700">
                <button
                  onClick={toggleRecommendations}
                  className="flex gap-1 items-center px-3 py-1 text-xs text-blue-600 bg-blue-50 rounded-full border border-blue-100 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900 hover:dark:bg-blue-900"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {getMessage("showRecommendation")}
                </button>
              </div>
            )}
          </>
        )}

        <div className="p-3">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {getMessage("selectDataTypes")}
              </p>
              <button
                onClick={() => handleSelectAll(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {dataTypeOptions
                  .slice(0, 4)
                  .every(({ value }) => selectedTypes.includes(value))
                  ? "取消全选"
                  : "全选基本类型"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              {dataTypeOptions.slice(0, 4).map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors
                    ${
                      selectedTypes.includes(value)
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(value)}
                    onChange={() => handleTypeChange(value)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {label}
                  </span>
                </label>
              ))}
            </div>

            {/* 高级数据类型 */}
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                高级数据类型:
              </p>
              <button
                onClick={() => handleSelectAll(false)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {dataTypeOptions
                  .slice(4)
                  .every(({ value }) => selectedTypes.includes(value))
                  ? "取消全选"
                  : "全选高级类型"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {dataTypeOptions.slice(4).map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-1 p-2 rounded-md border cursor-pointer transition-colors
                    ${
                      selectedTypes.includes(value)
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(value)}
                    onChange={() => handleTypeChange(value)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-200">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {hasSensitiveData && (
            <div className="flex gap-2 items-start p-3 mb-4 bg-amber-50 rounded-md border border-amber-200 dark:bg-amber-900 dark:border-amber-700">
              <svg
                className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0 dark:text-amber-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-amber-700 dark:text-amber-200">
                {getMessage("sensitiveWarning")}
              </p>
            </div>
          )}

          <button
            onClick={handleClearCache}
            disabled={isLoading || !currentDomain || selectedTypes.length === 0}
            className={`w-full px-4 py-3 rounded-md text-white text-sm font-medium transition-colors
              ${
                isLoading || !currentDomain || selectedTypes.length === 0
                  ? "bg-blue-300 cursor-not-allowed dark:bg-blue-900"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              }`}
          >
            {isLoading ? (
              <div className="flex gap-2 justify-center items-center">
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
                {getMessage("clearing")}
              </div>
            ) : (
              getMessage("clearData")
            )}
          </button>

          {message && (
            <div
              className={`mt-4 p-3 rounded-md flex items-start gap-2
                ${
                  message.includes("成功")
                    ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                    : "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
                }`}
              data-testid="status-message"
            >
              {message}
              {clearTime && message.includes("成功") && (
                <span className="ml-1 text-xs text-gray-500">
                  (用时 {clearTime} ms)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CacheClearButton;
