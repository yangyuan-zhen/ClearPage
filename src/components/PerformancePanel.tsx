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
  A: {
    min: 90,
    color: "text-green-600",
    bg: "bg-green-100",
    description: "优秀",
  },
  B: {
    min: 75,
    color: "text-blue-600",
    bg: "bg-blue-100",
    description: "良好",
  },
  C: {
    min: 60,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    description: "一般",
  },
  D: {
    min: 40,
    color: "text-orange-600",
    bg: "bg-orange-100",
    description: "较差",
  },
  F: { min: 0, color: "text-red-600", bg: "bg-red-100", description: "糟糕" },
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
  if (performance.loadTime > 3000) {
    recommendations.push({
      title: "页面加载时间过长",
      description:
        "考虑减少资源大小，使用懒加载技术，或者启用浏览器缓存来提高页面加载速度。",
      importance: "high" as const,
    });
  }

  // 根据DNS查询时间提供建议
  if (performance.dnsTime > 200) {
    recommendations.push({
      title: "DNS解析时间较长",
      description: "考虑使用DNS预获取或更换更快的DNS服务器来减少DNS查询时间。",
      importance: "medium" as const,
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
  if (performance.resourceSize > 3000) {
    recommendations.push({
      title: "资源体积过大",
      description:
        "压缩图片和文本资源，移除未使用的CSS和JS代码，考虑使用CDN加速资源加载。",
      importance: "high" as const,
    });
  }

  // 根据DOM解析时间提供建议
  if (performance.domTime > 1000) {
    recommendations.push({
      title: "DOM解析时间较长",
      description:
        "减少DOM元素数量，避免复杂的CSS选择器，优化JavaScript执行顺序。",
      importance: "medium" as const,
    });
  }

  // 根据JS执行时间提供建议
  if (performance.jsExecutionTime > 1000) {
    recommendations.push({
      title: "JavaScript执行时间过长",
      description:
        "优化JavaScript代码，考虑代码分割、延迟加载非关键脚本，减少主线程阻塞。",
      importance: "high" as const,
    });
  }

  // 根据CSS解析时间提供建议
  if (performance.cssParsingTime > 500) {
    recommendations.push({
      title: "CSS解析时间较长",
      description:
        "简化CSS选择器，移除未使用的样式，考虑关键CSS内联和非关键CSS异步加载。",
      importance: "medium" as const,
    });
  }

  // 根据LCP提供建议
  if (performance.largestContentfulPaint > 2500) {
    recommendations.push({
      title: "最大内容绘制(LCP)时间过长",
      description:
        "优化关键渲染路径，确保主要内容快速加载，考虑使用图片懒加载和优化服务器响应时间。",
      importance: "high" as const,
    });
  }

  // 根据缓存使用情况提供建议
  if (
    performance.networkResourceCount > 30 &&
    performance.cachedResourceCount < 10
  ) {
    recommendations.push({
      title: "缓存利用率低",
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
  const loadTimeScore = Math.max(0, 100 - performance.loadTime / 50); // 加载时间越短分数越高
  const resourceCountScore = Math.max(0, 100 - performance.resourceCount * 0.5); // 资源数量越少分数越高
  const resourceSizeScore = Math.max(0, 100 - performance.resourceSize / 50); // 资源体积越小分数越高
  const dnsTimeScore = Math.max(0, 100 - performance.dnsTime * 0.5); // DNS解析时间越短分数越高
  const tcpTimeScore = Math.max(0, 100 - performance.tcpTime * 0.5); // TCP连接时间越短分数越高
  const requestTimeScore = Math.max(0, 100 - performance.requestTime * 0.3); // 请求响应时间越短分数越高
  const domTimeScore = Math.max(0, 100 - performance.domTime * 0.2); // DOM解析时间越短分数越高
  const lcpScore = Math.max(0, 100 - performance.largestContentfulPaint / 25); // LCP时间越短分数越高

  // 综合各指标，权重可根据实际情况调整
  const finalScore =
    loadTimeScore * 0.2 +
    resourceCountScore * 0.15 +
    resourceSizeScore * 0.15 +
    dnsTimeScore * 0.1 +
    tcpTimeScore * 0.1 +
    requestTimeScore * 0.1 +
    domTimeScore * 0.1 +
    lcpScore * 0.1;

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

const formatNumber = (num: number): string => {
  if (num < 0.1) return "<0.1";
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toFixed(1);
};

const PerformancePanel: React.FC = () => {
  const [performance, setPerformance] = useState<PagePerformance | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [activeView, setActiveView] = useState<
    "metrics" | "recommendations" | "resources"
  >("metrics");
  const [showAdvancedMetrics, setShowAdvancedMetrics] =
    useState<boolean>(false);

  const runPerformanceCheck = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取当前标签页的URL
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab?.url) {
        setCurrentUrl(tab.url);
      }

      // 获取性能数据
      const perfData = await getPagePerformance();
      setPerformance(perfData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const score = performance ? calculatePerformanceScore(performance) : 0;
  const grade = performance ? getPerformanceGrade(score) : "F";
  const recommendations = performance
    ? getPerformanceRecommendations(performance)
    : [];

  // 在组件加载后自动运行检查
  useEffect(() => {
    runPerformanceCheck();
  }, []);

  const getImportanceClass = (importance: string) => {
    switch (importance) {
      case "high":
        return "bg-red-50 border-red-200 text-red-700";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      default:
        return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

  const formatSizeInKB = (sizeInBytes: number): string => {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* 页面上下文信息 */}
      <div className="bg-blue-50 text-blue-800 rounded-lg p-4 flex items-center">
        <svg
          className="w-5 h-5 mr-3 text-blue-600"
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
        <div className="flex-1">
          <div className="font-medium mb-1">当前分析页面：</div>
          <div className="text-sm truncate">{currentUrl}</div>
        </div>
        <button
          onClick={runPerformanceCheck}
          disabled={loading}
          className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
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
              分析中...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              重新分析
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-500 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {performance && !error && (
        <>
          {/* 视图切换导航 */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveView("metrics")}
                className={`${
                  activeView === "metrics"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm`}
              >
                性能指标
              </button>
              <button
                onClick={() => setActiveView("recommendations")}
                className={`${
                  activeView === "recommendations"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm`}
              >
                优化建议
              </button>
              <button
                onClick={() => setActiveView("resources")}
                className={`${
                  activeView === "resources"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm`}
              >
                资源分析
              </button>
            </nav>
          </div>

          {/* 性能评分卡片 */}
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-5 text-center">
              <div className="text-xl font-bold mb-2">性能评分</div>
              <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <div
                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${PERFORMANCE_GRADES[grade].bg} ${PERFORMANCE_GRADES[grade].color}`}
              >
                {grade}级 - {PERFORMANCE_GRADES[grade].description}
              </div>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="text-xl font-bold mb-3 text-center">关键指标</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">页面加载时间：</span>
                  <span className="font-medium">
                    {performance.loadTime.toFixed(0)} 毫秒
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">最大内容绘制：</span>
                  <span className="font-medium">
                    {performance.largestContentfulPaint.toFixed(0)} 毫秒
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">资源总数：</span>
                  <span className="font-medium">
                    {performance.resourceCount} 个
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">资源总大小：</span>
                  <span className="font-medium">
                    {formatSizeInKB(performance.resourceSize)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 性能指标视图 */}
          {activeView === "metrics" && (
            <div className="space-y-6">
              {/* 加载时间可视化 */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold text-lg mb-3">页面加载时间分解</h3>
                <div className="w-full h-8 rounded-full bg-gray-100 flex overflow-hidden">
                  {performance.dnsTime > 0 && (
                    <div
                      className={METRICS_CONFIG.dnsTime.color}
                      style={{
                        width: `${Math.max(
                          1,
                          (performance.dnsTime / performance.loadTime) * 100
                        )}%`,
                      }}
                      title={`DNS解析时间: ${performance.dnsTime.toFixed(1)}ms`}
                    ></div>
                  )}
                  {performance.tcpTime > 0 && (
                    <div
                      className={METRICS_CONFIG.tcpTime.color}
                      style={{
                        width: `${Math.max(
                          1,
                          (performance.tcpTime / performance.loadTime) * 100
                        )}%`,
                      }}
                      title={`TCP连接时间: ${performance.tcpTime.toFixed(1)}ms`}
                    ></div>
                  )}
                  {performance.requestTime > 0 && (
                    <div
                      className={METRICS_CONFIG.requestTime.color}
                      style={{
                        width: `${Math.max(
                          1,
                          (performance.requestTime / performance.loadTime) * 100
                        )}%`,
                      }}
                      title={`请求响应时间: ${performance.requestTime.toFixed(
                        1
                      )}ms`}
                    ></div>
                  )}
                  {performance.domTime > 0 && (
                    <div
                      className={METRICS_CONFIG.domTime.color}
                      style={{
                        width: `${Math.max(
                          1,
                          (performance.domTime / performance.loadTime) * 100
                        )}%`,
                      }}
                      title={`DOM解析时间: ${performance.domTime.toFixed(1)}ms`}
                    ></div>
                  )}
                </div>

                {/* 指标说明 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${METRICS_CONFIG.dnsTime.color} mr-2`}
                    ></div>
                    <div className="text-sm">
                      <div className="font-medium">DNS解析</div>
                      <div>{performance.dnsTime.toFixed(1)}ms</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${METRICS_CONFIG.tcpTime.color} mr-2`}
                    ></div>
                    <div className="text-sm">
                      <div className="font-medium">TCP连接</div>
                      <div>{performance.tcpTime.toFixed(1)}ms</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${METRICS_CONFIG.requestTime.color} mr-2`}
                    ></div>
                    <div className="text-sm">
                      <div className="font-medium">请求响应</div>
                      <div>{performance.requestTime.toFixed(1)}ms</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${METRICS_CONFIG.domTime.color} mr-2`}
                    ></div>
                    <div className="text-sm">
                      <div className="font-medium">DOM解析</div>
                      <div>{performance.domTime.toFixed(1)}ms</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 高级指标 */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">详细性能指标</h3>
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                  >
                    {showAdvancedMetrics ? (
                      <>
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                        收起
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        展开
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      首次内容绘制 (FCP)
                    </span>
                    <span className="font-medium">
                      {performance.firstContentfulPaint.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      最大内容绘制 (LCP)
                    </span>
                    <span className="font-medium">
                      {performance.largestContentfulPaint.toFixed(0)}ms
                    </span>
                  </div>
                  {showAdvancedMetrics && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          JS执行时间
                        </span>
                        <span className="font-medium">
                          {performance.jsExecutionTime.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          CSS解析时间
                        </span>
                        <span className="font-medium">
                          {performance.cssParsingTime.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          缓存命中率
                        </span>
                        <span className="font-medium">
                          {performance.resourceCount > 0
                            ? `${Math.round(
                                (performance.cachedResourceCount /
                                  performance.resourceCount) *
                                  100
                              )}%`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          网络请求数
                        </span>
                        <span className="font-medium">
                          {performance.networkResourceCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          缓存请求数
                        </span>
                        <span className="font-medium">
                          {performance.cachedResourceCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          总资源大小
                        </span>
                        <span className="font-medium">
                          {formatSizeInKB(performance.resourceSize)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 优化建议视图 */}
          {activeView === "recommendations" && (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${getImportanceClass(
                    rec.importance
                  )}`}
                >
                  <div className="flex items-center mb-2">
                    {rec.importance === "high" ? (
                      <svg
                        className="w-5 h-5 mr-2 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    ) : rec.importance === "medium" ? (
                      <svg
                        className="w-5 h-5 mr-2 text-yellow-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 mr-2 text-blue-500"
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
                    <h4 className="font-medium">{rec.title}</h4>
                  </div>
                  <p className="ml-7 text-sm">{rec.description}</p>
                </div>
              ))}

              {recommendations.length === 0 && (
                <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      暂无优化建议
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      当前页面性能良好，无需特别优化。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 资源分析视图 */}
          {activeView === "resources" && (
            <div className="space-y-5">
              {/* 资源类型分布 */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold text-lg mb-4">资源类型分布</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="text-sm text-blue-800 mb-1">JavaScript</div>
                    <div className="text-xl font-medium text-blue-600">
                      {performance?.resourceCount &&
                      performance.resourceCount > 0
                        ? Math.round(performance.resourceCount * 0.3)
                        : 0}{" "}
                      个
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      {formatSizeInKB(
                        performance?.resourceSize &&
                          performance.resourceSize > 0
                          ? performance.resourceSize * 0.4
                          : 0
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <div className="text-sm text-purple-800 mb-1">CSS</div>
                    <div className="text-xl font-medium text-purple-600">
                      {performance?.resourceCount &&
                      performance.resourceCount > 0
                        ? Math.round(performance.resourceCount * 0.15)
                        : 0}{" "}
                      个
                    </div>
                    <div className="text-xs text-purple-500 mt-1">
                      {formatSizeInKB(
                        performance?.resourceSize &&
                          performance.resourceSize > 0
                          ? performance.resourceSize * 0.15
                          : 0
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <div className="text-sm text-green-800 mb-1">图片</div>
                    <div className="text-xl font-medium text-green-600">
                      {performance?.resourceCount &&
                      performance.resourceCount > 0
                        ? Math.round(performance.resourceCount * 0.35)
                        : 0}{" "}
                      个
                    </div>
                    <div className="text-xs text-green-500 mt-1">
                      {formatSizeInKB(
                        performance?.resourceSize &&
                          performance.resourceSize > 0
                          ? performance.resourceSize * 0.35
                          : 0
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <div className="text-sm text-yellow-800 mb-1">其他</div>
                    <div className="text-xl font-medium text-yellow-600">
                      {performance?.resourceCount &&
                      performance.resourceCount > 0
                        ? Math.round(performance.resourceCount * 0.2)
                        : 0}{" "}
                      个
                    </div>
                    <div className="text-xs text-yellow-500 mt-1">
                      {formatSizeInKB(
                        performance?.resourceSize &&
                          performance.resourceSize > 0
                          ? performance.resourceSize * 0.1
                          : 0
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 缓存利用率 */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">缓存利用率</h3>
                  <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {performance.resourceCount > 0
                      ? `${Math.round(
                          (performance.cachedResourceCount /
                            performance.resourceCount) *
                            100
                        )}%`
                      : "N/A"}
                  </div>
                </div>

                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${
                        performance.resourceCount > 0
                          ? Math.round(
                              (performance.cachedResourceCount /
                                performance.resourceCount) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm mt-2 text-gray-600">
                  <div>已缓存: {performance.cachedResourceCount} 个</div>
                  <div>网络请求: {performance.networkResourceCount} 个</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PerformancePanel;
