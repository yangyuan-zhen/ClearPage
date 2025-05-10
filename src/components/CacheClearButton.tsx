import React, { useState, useEffect } from "react";
import { clearDomainCache } from "../utils/cacheUtils";
import {
  getSmartCleaningRecommendations,
  getCleaningAdvice,
} from "../utils/smartCleanUtils";
import type { DataType } from "../types";
import { getMessage } from "../utils/i18n";
import {
  clearIndexedDB,
  clearSessionStorage,
  clearWebSQL,
  clearFormData,
  clearFileSystem,
} from "@/utils";

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

  // 添加状态标记当前选择是否与推荐一致
  const [isRecommendationApplied, setIsRecommendationApplied] =
    useState<boolean>(false);

  // 在组件状态中添加清理进度相关状态
  const [isCleaningComplete, setIsCleaningComplete] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"standard" | "smart">("smart");

  const dataTypeOptions: {
    value: DataType;
    label: string;
    description: string;
  }[] = [
    {
      value: "cache",
      label: getMessage("cache"),
      description: "网站图像、脚本和其他媒体文件的临时存储",
    },
    {
      value: "cookies",
      label: getMessage("cookies"),
      description: "网站保存的登录状态、偏好设置等信息",
    },
    {
      value: "localStorage",
      label: getMessage("localStorage"),
      description: "网站在您浏览器中存储的持久数据",
    },
    {
      value: "serviceWorkers",
      label: getMessage("serviceWorker"),
      description: "网站的后台脚本，可能会导致缓存问题",
    },
    {
      value: "indexedDB" as DataType,
      label: getMessage("indexedDB") || "IndexedDB 数据库",
      description: "网站存储的结构化数据",
    },
    {
      value: "sessionStorage" as DataType,
      label: getMessage("sessionStorage") || "SessionStorage 会话存储",
      description: "本次会话中网站临时存储的数据",
    },
    {
      value: "webSQL" as DataType,
      label: getMessage("webSQL") || "WebSQL 数据库",
      description: "旧版本网站使用的数据库存储",
    },
    {
      value: "formData" as DataType,
      label: getMessage("formData") || "表单数据",
      description: "保存的表单输入和自动完成数据",
    },
    {
      value: "fileSystem" as DataType,
      label: getMessage("fileSystem") || "文件系统存储",
      description: "网站在您设备上存储的文件",
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
        const smartRecommendations =
          getSmartCleaningRecommendations(currentDomain);

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
    setIsCleaningComplete(false);

    try {
      const startTime = performance.now();

      // 依次清理每种类型的数据
      for (const dataType of selectedTypes) {
        switch (dataType) {
          case "cache":
          case "cookies":
          case "localStorage":
          case "serviceWorkers":
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
      setMessage("清理成功！页面数据已被清除。");
    } catch (error) {
      console.error("清理缓存时出错:", error);
      setMessage(
        `清理失败: ${error instanceof Error ? error.message : "未知错误"}`
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
    if (!domain) return "当前网站";

    // 移除www.前缀和子域名
    const baseDomain = domain
      .replace(/^www\./, "")
      .split(".")
      .slice(-2)
      .join(".");

    // 添加网站名称映射
    const siteNameMap: Record<string, string> = {
      "google.com": "Google",
      "baidu.com": "百度",
      "bilibili.com": "哔哩哔哩",
      "taobao.com": "淘宝",
      "jd.com": "京东",
      "zhihu.com": "知乎",
      "sina.com.cn": "新浪",
      "qq.com": "腾讯",
      "163.com": "网易",
    };

    return siteNameMap[baseDomain] || domain;
  };

  return (
    <div className="space-y-6">
      {/* 页面上下文信息 */}
      <div className="flex items-center p-4 text-blue-800 bg-blue-50 rounded-lg">
        <svg
          className="mr-3 w-5 h-5 text-blue-600"
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
        <div>
          <div className="mb-1 font-medium">
            当前网站：{getFriendlySiteName(currentDomain)} ({currentDomain})
          </div>
          <div className="text-sm">
            您可以选择要清理的数据类型，然后点击"开始清理"按钮
          </div>
        </div>
      </div>

      {/* 选择模式标签页 */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("smart")}
            className={`${
              activeTab === "smart"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } w-1/2 py-3 px-1 text-center border-b-2 font-medium text-sm`}
          >
            智能清理
          </button>
          <button
            onClick={() => setActiveTab("standard")}
            className={`${
              activeTab === "standard"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } w-1/2 py-3 px-1 text-center border-b-2 font-medium text-sm`}
          >
            自定义清理
          </button>
        </nav>
      </div>

      {/* 智能清理模式 */}
      {activeTab === "smart" && (
        <div className="space-y-4">
          {/* 智能推荐区域 */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-900">智能推荐</h3>
              <button
                onClick={applyRecommendations}
                disabled={isRecommendationApplied}
                className={`px-3 py-1 text-sm rounded-full ${
                  isRecommendationApplied
                    ? "text-gray-500 bg-gray-100 cursor-not-allowed"
                    : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                }`}
              >
                {isRecommendationApplied ? "已应用" : "应用建议"}
              </button>
            </div>

            <div className="p-3 bg-white rounded-md shadow-sm">
              <p className="mb-3 text-sm text-gray-600">
                {cleaningAdvice ||
                  "基于您的浏览历史和网站特性，我们建议清理以下数据类型："}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {recommendations.map((type) => {
                  const option = dataTypeOptions.find(
                    (opt) => opt.value === type
                  );
                  return (
                    <div
                      key={type}
                      className="flex items-center p-2 bg-blue-50 rounded-md border border-blue-100"
                    >
                      <svg
                        className="mr-2 w-4 h-4 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium">
                        {option?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 智能清理按钮 */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleClearCache}
              disabled={isLoading || selectedTypes.length === 0}
              className={`px-6 py-3 text-white font-medium rounded-lg flex items-center justify-center w-full ${
                isLoading || selectedTypes.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
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
                  清理中...
                </>
              ) : (
                <>智能清理数据</>
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
              onClick={() => handleSelectAll(false)}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              全选
            </button>
            <button
              onClick={() => handleSelectAll(true)}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              只选基本类型
            </button>
            <button
              onClick={() => setSelectedTypes([])}
              className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              清除选择
            </button>
          </div>

          {/* 数据类型选择网格 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dataTypeOptions.map(({ value, label, description }) => (
              <div
                key={value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedTypes.includes(value)
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200"
                }`}
                onClick={() => handleTypeChange(value)}
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(value)}
                    onChange={() => handleTypeChange(value)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {label}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 清理按钮 */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleClearCache}
              disabled={isLoading || selectedTypes.length === 0}
              className={`px-5 py-2 rounded-lg flex items-center space-x-2 ${
                isLoading || selectedTypes.length === 0
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : sensitiveDataTypes.some((type) =>
                      selectedTypes.includes(type)
                    )
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
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
                  <span>清理中...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>清理选中数据 ({selectedTypes.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 清理结果消息 */}
      {(message || clearTime !== null) && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            isCleaningComplete
              ? "bg-green-50 border border-green-100"
              : "bg-yellow-50 border border-yellow-100"
          }`}
        >
          <div className="flex">
            {isCleaningComplete ? (
              <svg
                className="mr-3 w-6 h-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="mr-3 w-6 h-6 text-yellow-500"
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
            )}
            <div>
              <p
                className={
                  isCleaningComplete ? "text-green-700" : "text-yellow-700"
                }
              >
                {message}
              </p>
              {clearTime !== null && (
                <p className="mt-1 text-sm text-gray-600">
                  清理完成，耗时 {clearTime} 毫秒
                </p>
              )}
              {isCleaningComplete && (
                <p className="mt-1 text-sm text-gray-600">
                  您可能需要刷新页面以查看清理效果
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheClearButton;
