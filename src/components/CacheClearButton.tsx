import React, { useState, useEffect } from "react";
import { clearDomainCache } from "../utils/cacheUtils";
import {
  getSmartCleaningRecommendations,
  getCleaningAdvice,
} from "../utils/smartCleanUtils";
import { cleanHistoryService } from "../services/historyService";
import type { DataType } from "../types";
import { getMessage } from "../utils/i18n";

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
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>(["cache"]);
  const [clearTime, setClearTime] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<DataType[]>([]);
  const [cleaningAdvice, setCleaningAdvice] = useState<string>("");
  const [showRecommendations, setShowRecommendations] = useState<boolean>(true);

  // 添加上次清理时间的状态
  const [lastCleanTime, setLastCleanTime] = useState<number | null>(null);
  const [timeSinceLastClean, setTimeSinceLastClean] = useState<string>("");

  const dataTypeOptions: { value: DataType; label: string }[] = [
    { value: "cache", label: getMessage("cache") },
    { value: "cookies", label: getMessage("cookies") },
    { value: "localStorage", label: getMessage("localStorage") },
    { value: "serviceWorkers", label: getMessage("serviceWorker") },
  ];

  const sensitiveDataTypes: DataType[] = ["cookies", "localStorage"];

  const hasSensitiveData = selectedTypes.some((type) =>
    sensitiveDataTypes.includes(type)
  );

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

        setRecommendations(smartRecommendations);
        setCleaningAdvice(
          getCleaningAdvice(currentDomain, smartRecommendations)
        );
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
  };

  const applyRecommendations = () => {
    if (recommendations.length > 0) {
      setSelectedTypes(recommendations);
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
                <div className="flex flex-wrap gap-2 items-center mt-3">
                  <button
                    onClick={applyRecommendations}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    {getMessage("applyRecommendation")}
                  </button>
                  <div className="flex flex-wrap gap-1.5">
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
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {getMessage("selectDataTypes")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {dataTypeOptions.map(({ value, label }) => (
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
          </div>

          {hasSensitiveData && (
            <div className="flex gap-2 items-start p-3 mb-4 bg-amber-50 rounded-md border border-amber-200 dark:bg-amber-900 dark:border-amber-700">
              <p className="text-sm text-amber-700 dark:text-amber-200">
                {getMessage("sensitiveWarning")}
              </p>
            </div>
          )}

          <button
            onClick={handleClearCache}
            disabled={isLoading || !currentDomain || selectedTypes.length === 0}
            className={`w-full px-3 py-2 rounded-md text-white text-sm font-medium transition-colors
              ${
                isLoading || !currentDomain || selectedTypes.length === 0
                  ? "bg-blue-300 cursor-not-allowed dark:bg-blue-900"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              }`}
          >
            {isLoading ? (
              <div className="flex gap-2 justify-center items-center">
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
