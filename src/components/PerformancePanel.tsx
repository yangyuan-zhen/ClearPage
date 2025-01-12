import React, { useState } from "react";
import { getPagePerformance } from "../utils/performanceUtils";
import type { PagePerformance } from "../utils/performanceUtils";

const PerformancePanel: React.FC = () => {
  const [performance, setPerformance] = useState<PagePerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleCheck = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPagePerformance();
      setPerformance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取性能数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  const performanceMetrics = [
    { key: "dnsTime", label: "DNS 解析", unit: "ms" },
    { key: "tcpTime", label: "TCP 连接", unit: "ms" },
    { key: "requestTime", label: "请求响应", unit: "ms" },
    { key: "domTime", label: "DOM 解析", unit: "ms" },
    { key: "loadTime", label: "总加载时间", unit: "ms" },
    {
      key: "resource",
      label: "资源数量/大小",
      format: (p: PagePerformance) =>
        `${p.resourceCount}个 / ${p.resourceSize.toFixed(2)}KB`,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">页面性能检测</h2>
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="text-sm btn-secondary"
        >
          {isLoading ? "检测中..." : "检测性能"}
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {performance && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {performanceMetrics.map((metric) => (
            <div key={metric.key} className="p-2 bg-gray-50 rounded-md">
              <span className="text-gray-600">{metric.label}</span>
              <p className="font-medium">
                {metric.format
                  ? metric.format(performance)
                  : `${performance[metric.key as keyof PagePerformance].toFixed(
                      2
                    )}${metric.unit}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformancePanel;
