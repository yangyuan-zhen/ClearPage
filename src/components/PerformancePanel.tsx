import React, { useState, useEffect } from "react";
import { getPagePerformance } from "../utils/performanceUtils";
import type { PagePerformance } from "../utils/performanceUtils";
import {
  bytesToSize,
  formatNumber,
  formatTimeInMs,
} from "../utils/formatUtils";
import { useI18n } from "../utils/i18n";
import { motion } from "framer-motion";

// 导入性能组件
import ScoreCard from "./performance/ScoreCard";
import ResourceChart from "./performance/ResourceChart";
import MetricCard from "./performance/MetricCard";

// 修改METRICS_CONFIG以支持字符串索引
type MetricConfig = {
  color: string;
  colorLight: string;
  label: string;
};

// 性能指标类型及对应的颜色配置
const METRICS_CONFIG: Record<string, MetricConfig> = {
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
  jsExecutionTime: {
    color: "bg-indigo-500",
    colorLight: "bg-indigo-100",
    label: "JS执行",
  },
  cssParsingTime: {
    color: "bg-pink-500",
    colorLight: "bg-pink-100",
    label: "CSS解析",
  },
  firstContentfulPaint: {
    color: "bg-teal-500",
    colorLight: "bg-teal-100",
    label: "首次内容绘制",
  },
  largestContentfulPaint: {
    color: "bg-orange-500",
    colorLight: "bg-orange-100",
    label: "最大内容绘制",
  },
};

// 性能评级标准
const PERFORMANCE_GRADES = {
  A: { min: 90, color: "text-green-600 bg-green-100" },
  B: { min: 75, color: "text-teal-600 bg-teal-100" },
  C: { min: 60, color: "text-yellow-600 bg-yellow-100" },
  D: { min: 40, color: "text-orange-600 bg-orange-100" },
  F: { min: 0, color: "text-red-600 bg-red-100" },
};

// 性能优化建议
const getPerformanceRecommendations = (
  performance: PagePerformance
): {
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
}[] => {
  const recommendations: {
    title: string;
    description: string;
    importance: "high" | "medium" | "low";
  }[] = [];

  // 根据加载时间提供建议
  if (performance.timing > 3000) {
    recommendations.push({
      title: "页面加载时间过长",
      description:
        "考虑减少资源大小，使用懒加载技术，或者启用浏览器缓存来提高页面加载速度。",
      importance: "high" as const,
    });
  }

  // 根据资源数量提供建议
  if (performance.resourceCount > 50) {
    recommendations.push({
      title: "资源请求过多",
      description:
        "尝试合并CSS/JS文件，使用图片精灵或图标字体来减少HTTP请求数量。",
      importance: "high" as const,
    });
  }

  // 根据资源大小提供建议
  if (performance.resourceSize > 3000000) {
    // 转换为字节
    recommendations.push({
      title: "资源体积过大",
      description:
        "压缩图片和文本资源，移除未使用的CSS和JS代码，考虑使用CDN加速资源加载。",
      importance: "high" as const,
    });
  }

  // 根据DOM元素数量提供建议
  if (performance.domElements > 1000) {
    recommendations.push({
      title: "DOM元素过多",
      description:
        "减少DOM元素数量，避免复杂的CSS选择器，优化JavaScript执行顺序。",
      importance: "medium" as const,
    });
  }

  // 根据JS资源大小提供建议
  if (performance.jsSize > 500000) {
    recommendations.push({
      title: "JavaScript资源过大",
      description:
        "优化JavaScript代码，考虑代码分割、延迟加载非关键脚本，减少主线程阻塞。",
      importance: "high" as const,
    });
  }

  // 根据CSS资源大小提供建议
  if (performance.cssSize > 200000) {
    recommendations.push({
      title: "CSS资源过大",
      description:
        "简化CSS选择器，移除未使用的样式，考虑关键CSS内联和非关键CSS异步加载。",
      importance: "medium" as const,
    });
  }

  // 根据缓存使用情况提供建议
  if (performance.resourceSize > 1000000) {
    recommendations.push({
      title: "缓存优化建议",
      description:
        "配置适当的缓存策略，为静态资源设置合理的缓存头，利用Service Worker实现离线缓存。",
      importance: "medium" as const,
    });
  }

  // 如果性能良好，也给出积极反馈
  if (recommendations.length === 0) {
    recommendations.push({
      title: "页面性能良好",
      description: "当前页面加载性能表现良好，继续保持！",
      importance: "low" as const,
    });
  }

  return recommendations;
};

// 计算性能评分
const calculatePerformanceScore = (performance: PagePerformance): number => {
  // 基于各项指标计算总体评分，满分100分
  const loadTimeScore = Math.max(0, 100 - performance.timing / 50); // 加载时间越短分数越高
  const resourceCountScore = Math.max(0, 100 - performance.resourceCount * 0.5); // 资源数量越少分数越高
  const resourceSizeScore = Math.max(0, 100 - performance.resourceSize / 50000); // 资源体积越小分数越高

  const domElementsScore = Math.max(0, 100 - performance.domElements / 100); // DOM元素越少分数越高
  const jsSizeScore = Math.max(0, 100 - performance.jsSize / 100000); // JS大小越小分数越高
  const cssSizeScore = Math.max(0, 100 - performance.cssSize / 50000); // CSS大小越小分数越高

  // 综合各指标，权重可根据实际情况调整
  const finalScore =
    loadTimeScore * 0.3 +
    resourceCountScore * 0.15 +
    resourceSizeScore * 0.15 +
    domElementsScore * 0.15 +
    jsSizeScore * 0.15 +
    cssSizeScore * 0.1;

  return Math.round(finalScore);
};

const getPerformanceGrade = (
  score: number
): keyof typeof PERFORMANCE_GRADES => {
  if (score >= PERFORMANCE_GRADES.A.min) return "A";
  if (score >= PERFORMANCE_GRADES.B.min) return "B";
  if (score >= PERFORMANCE_GRADES.C.min) return "C";
  if (score >= PERFORMANCE_GRADES.D.min) return "D";
  return "F";
};

// 获取性能评级
const getPerformanceRating = (score: number): string => {
  if (score >= 90) return "优秀";
  if (score >= 70) return "良好";
  if (score >= 50) return "一般";
  return "较差";
};

// 获取加载时间评级
const getLoadingTimeRating = (time: number): string => {
  if (time < 2000) return "优秀";
  if (time < 4000) return "良好";
  if (time < 6000) return "一般";
  return "较差";
};

// 异步清理函数
const performAsyncCleanup = (callback: () => void) => {
  // 使用requestIdleCallback或setTimeout实现异步处理
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => callback());
  } else {
    setTimeout(callback, 1);
  }
};

const PerformancePanel: React.FC = () => {
  const { t, currentLang } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [performance, setPerformance] = useState<PagePerformance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSpecialPage, setIsSpecialPage] = useState(false);

  const fetchPerformance = async (forceRetry = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // 如果是强制重试，增加重试计数
      if (forceRetry) {
        setRetryCount((prev) => prev + 1);
      }

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.url) {
        throw new Error(
          currentLang === "zh_CN"
            ? "无法获取当前页面信息"
            : "Could not get current page information"
        );
      }

      setCurrentUrl(tab.url);

      // 检查特殊页面
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:") ||
        tab.url.startsWith("file://")
      ) {
        setIsSpecialPage(true);
      }

      const performanceData = await getPagePerformance(tab.id as number);

      // 利用异步清理来防止UI阻塞
      performAsyncCleanup(() => {
        if (performanceData) {
          setPerformance(performanceData);
          setIsLoading(false);
        } else {
          throw new Error(
            currentLang === "zh_CN"
              ? "无法获取性能数据，请刷新页面重试"
              : "Could not get performance data. Please refresh the page and try again"
          );
        }
      });
    } catch (err) {
      console.error("Performance fetch error:", err);

      let errorMessage =
        err instanceof Error
          ? err.message
          : currentLang === "zh_CN"
          ? "获取性能数据时出错"
          : "Error fetching performance data";

      // 根据重试次数提供不同的错误提示
      if (retryCount >= 2) {
        errorMessage =
          currentLang === "zh_CN"
            ? "多次尝试获取性能数据失败。请确保您浏览的是标准网页，并且已授予扩展程序必要的权限。"
            : "Multiple attempts to retrieve performance data have failed. Please ensure you are browsing a standard webpage and have granted the extension necessary permissions.";
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  // 确定资源数量状态
  const getResourceCountStatus = (
    count: number
  ): "good" | "medium" | "poor" => {
    if (count < 20) return "good";
    if (count < 50) return "medium";
    return "poor";
  };

  // 确定资源大小状态
  const getResourceSizeStatus = (size: number): "good" | "medium" | "poor" => {
    if (size < 500000) return "good"; // 500KB
    if (size < 2000000) return "medium"; // 2MB
    return "poor";
  };

  // 确定缓存命中率状态
  const getCacheHitRateStatus = (rate: number): "good" | "medium" | "poor" => {
    if (rate > 70) return "good";
    if (rate > 40) return "medium";
    return "poor";
  };

  // 确定内存使用状态
  const getMemoryUsageStatus = (memory: number): "good" | "medium" | "poor" => {
    if (memory < 30) return "good";
    if (memory < 60) return "medium";
    return "poor";
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          {t("performance_detection", "性能检测")}
        </h2>
        <p className="text-sm text-gray-600">
          {t(
            "analyze_page_performance",
            "分析当前页面的加载性能和资源使用情况"
          )}
        </p>
      </div>

      {isLoading ? (
        <motion.div
          className="flex justify-center items-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">
            {t("loading_performance", "加载性能数据中...")}
          </span>
        </motion.div>
      ) : error ? (
        <motion.div
          className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-medium mb-1">{t("error", "错误")}</h3>
          <p className="text-sm break-words">{error}</p>
          <div className="mt-3 space-y-2">
            <button
              onClick={() => fetchPerformance(true)}
              className="w-full text-white bg-red-600 hover:bg-red-700 py-2 px-3 rounded text-sm font-medium transition-colors"
            >
              {t("try_again", "重试")}
            </button>
            <div className="text-xs text-red-600 mt-2">
              <p>
                {t(
                  "troubleshooting_tips",
                  "故障排除提示: 尝试刷新页面后再检测，或者在页面完全加载后再尝试。"
                )}
              </p>
            </div>
          </div>
        </motion.div>
      ) : performance ? (
        <div className="space-y-6">
          {/* 顶部信息 */}
          <motion.div
            className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center">
              <div className="text-xl text-blue-700 mr-2">ℹ️</div>
              <div>
                <h3 className="font-medium text-blue-800">
                  {t("current_page", "当前页面")}
                </h3>
                <p className="text-sm text-blue-700 truncate max-w-full">
                  {currentUrl}
                </p>
              </div>
            </div>
          </motion.div>

          {/* 区块一：评分和加载时间 */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-3">
              {t("performance_overview", "性能概览")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* 总体评分卡片 */}
              <ScoreCard
                score={performance.score}
                title={t("overall_score", "总体评分")}
                getRating={getPerformanceRating}
                t={t}
              />

              {/* 加载时间卡片 */}
              <MetricCard
                title={t("loading_time", "加载时间")}
                value={formatNumber(performance.timing / 1000 || 0)}
                unit="s"
                status={
                  performance.timing < 2000
                    ? "good"
                    : performance.timing < 4000
                    ? "medium"
                    : "poor"
                }
                icon="⏱️"
                description={t(
                  getLoadingTimeRating(performance.timing),
                  getLoadingTimeRating(performance.timing)
                )}
              />
            </div>

            {/* 关键性能指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MetricCard
                title={t("first_paint", "首次绘制")}
                value={formatTimeInMs(performance.firstPaint)}
                status={
                  performance.firstPaint < 1000
                    ? "good"
                    : performance.firstPaint < 2000
                    ? "medium"
                    : "poor"
                }
              />

              <MetricCard
                title={t("first_contentful_paint", "首次内容绘制")}
                value={formatTimeInMs(performance.firstContentfulPaint)}
                status={
                  performance.firstContentfulPaint < 1500
                    ? "good"
                    : performance.firstContentfulPaint < 3000
                    ? "medium"
                    : "poor"
                }
              />

              <MetricCard
                title={t("dom_interactive", "DOM可交互")}
                value={formatTimeInMs(performance.domInteractive)}
                status={
                  performance.domInteractive < 2000
                    ? "good"
                    : performance.domInteractive < 4000
                    ? "medium"
                    : "poor"
                }
              />

              <MetricCard
                title={t("dom_complete", "DOM完成")}
                value={formatTimeInMs(performance.domComplete)}
                status={
                  performance.domComplete < 3000
                    ? "good"
                    : performance.domComplete < 6000
                    ? "medium"
                    : "poor"
                }
              />
            </div>
          </div>

          {/* 区块二：资源数量、大小和图表 */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-3">
              {t("resource_analysis", "资源分析")}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MetricCard
                title={t("resource_count", "资源数量")}
                value={performance.resourceCount}
                status={getResourceCountStatus(performance.resourceCount)}
                icon="📦"
              />

              <MetricCard
                title={t("resource_size", "资源大小")}
                value={bytesToSize(performance.resourceSize)}
                status={getResourceSizeStatus(performance.resourceSize)}
                icon="📊"
              />

              <MetricCard
                title={t("cache_hit_rate", "缓存命中率")}
                value={performance.cacheHitRate}
                unit="%"
                status={getCacheHitRateStatus(performance.cacheHitRate)}
                icon="📝"
              />

              <MetricCard
                title={t("memory_usage", "内存使用")}
                value={performance.memoryUsage}
                unit="MB"
                status={getMemoryUsageStatus(performance.memoryUsage)}
                icon="💾"
              />
            </div>

            {/* 执行时间指标 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <MetricCard
                title={t("js_execution_time", "JS执行时间")}
                value={formatTimeInMs(performance.jsExecutionTime)}
                status={
                  performance.jsExecutionTime < 300
                    ? "good"
                    : performance.jsExecutionTime < 800
                    ? "medium"
                    : "poor"
                }
              />

              <MetricCard
                title={t("css_parsing_time", "CSS解析时间")}
                value={formatTimeInMs(performance.cssParsingTime)}
                status={
                  performance.cssParsingTime < 100
                    ? "good"
                    : performance.cssParsingTime < 300
                    ? "medium"
                    : "poor"
                }
              />

              <MetricCard
                title={t("dom_elements", "DOM元素数量")}
                value={performance.domElements}
                status={
                  performance.domElements < 500
                    ? "good"
                    : performance.domElements < 1500
                    ? "medium"
                    : "poor"
                }
              />
            </div>

            {/* 资源分析图表 */}
            <ResourceChart
              resourceTypes={performance.resourceTypes}
              jsSize={performance.jsSize}
              cssSize={performance.cssSize}
              imageSize={performance.imageSize}
              t={t}
            />
          </div>

          {/* 运行性能检测按钮 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => fetchPerformance(false)}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              {t("run_test", "重新检测")}
            </button>
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {t("no_data", "暂无性能数据")}
        </div>
      )}
    </div>
  );
};

export default PerformancePanel;
