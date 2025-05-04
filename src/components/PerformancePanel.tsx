import React, { useState, useEffect } from "react";
import { getPagePerformance } from "../utils/performanceUtils";
import type { PagePerformance } from "../utils/performanceUtils";
import { getMessage } from "../utils/i18n";

// 性能指标类型及对应的颜色配置
const METRICS_CONFIG = {
  dnsTime: { color: "bg-blue-500", colorLight: "bg-blue-100", label: "DNS" },
  tcpTime: {
    color: "bg-emerald-500",
    colorLight: "bg-emerald-100",
    label: "TCP",
  },
  requestTime: {
    color: "bg-amber-500",
    colorLight: "bg-amber-100",
    label: "请求响应",
  },
  domTime: {
    color: "bg-purple-500",
    colorLight: "bg-purple-100",
    label: "DOM解析",
  },
  loadTime: { color: "bg-red-500", colorLight: "bg-red-100", label: "总时间" },
};

// 用于显示简化形式的大数字
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}s`;
  }
  return `${Math.round(num)}ms`;
};

const PerformancePanel: React.FC = () => {
  const [performance, setPerformance] = useState<PagePerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 执行性能检测函数
  const runPerformanceCheck = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPagePerformance();
      setPerformance(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : getMessage("performanceError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 组件挂载时自动执行性能检测
  useEffect(() => {
    runPerformanceCheck();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-medium">
          {getMessage("performanceCheck")}
        </h2>
        <button
          onClick={runPerformanceCheck}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-md text-white bg-blue-600 hover:bg-blue-700 text-xs font-medium transition-colors ${
            isLoading ? "opacity-70 cursor-wait" : ""
          }`}
        >
          {isLoading
            ? getMessage("checking")
            : getMessage("refreshPerformance")}
        </button>
      </div>

      {error && (
        <div className="p-3 text-xs text-red-600 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {isLoading && !performance && (
        <div className="flex justify-center items-center py-6">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-600">
            {getMessage("loading")}
          </span>
        </div>
      )}

      {performance && !error && (
        <div className="overflow-hidden rounded-md border">
          {/* 时间指标 */}
          <div className="grid grid-cols-3 gap-0.5 p-2 bg-gray-50">
            {Object.entries(METRICS_CONFIG).map(([key, config]) => {
              const value = performance[key as keyof PagePerformance] as number;
              return (
                <div key={key} className="p-2 bg-white rounded-md shadow-sm">
                  <div className="text-xs text-gray-500">{getMessage(key)}</div>
                  <div className="flex items-end mt-1">
                    <span className="text-base font-semibold">
                      {formatNumber(value)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${config.color}`}
                      style={{
                        width: `${Math.min(
                          value / (key === "loadTime" ? 30 : 10),
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 资源统计 */}
          <div className="flex justify-between items-center p-3 border-t">
            <div className="flex items-center">
              <div className="flex justify-center items-center w-8 h-8 text-indigo-600 bg-indigo-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-xs text-gray-500">
                  {getMessage("resourceInfo")}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base font-semibold">
                    {performance.resourceCount}
                  </span>
                  <span className="text-xs text-gray-500">/</span>
                  <span className="text-base font-semibold">
                    {performance.resourceSize.toFixed(0)}
                  </span>
                  <span className="text-xs text-gray-500">KB</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* 移除缓存命中率显示或计算缓存命中率 */}
              {/* 
              <div className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                {Math.floor(performance.cacheHitRate * 100)}% 缓存命中
              </div>
              */}
              <div className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                {performance.resourceSize > 1024
                  ? `${(performance.resourceSize / 1024).toFixed(1)} MB`
                  : `${performance.resourceSize.toFixed(0)} KB`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformancePanel;
