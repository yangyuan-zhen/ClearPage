import React, { useState } from "react";
import { getPagePerformance } from "../utils/performanceUtils";
import type { PagePerformance } from "../utils/performanceUtils";
import { getMessage } from "../utils/i18n";

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

  // 简化缩写标签，减少文本长度
  const performanceItems = [
    { key: "dnsTime", label: "DNS", unit: "ms" },
    { key: "tcpTime", label: "TCP", unit: "ms" },
    { key: "requestTime", label: "请求响应", unit: "ms" },
    { key: "domTime", label: "DOM解析", unit: "ms" },
    { key: "loadTime", label: "总时间", unit: "ms" },
    {
      key: "resource",
      label: "资源数/大小",
      format: (p: PagePerformance) =>
        `${p.resourceCount}/${p.resourceSize.toFixed(0)}KB`,
    },
  ];

  return (
    <div className="flex flex-col gap-2 max-w-[300px]">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-medium">
          {getMessage("performanceCheck")}
        </h2>
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="px-2 py-1 text-xs btn-secondary"
        >
          {isLoading ? getMessage("checking") : getMessage("checkPerformance")}
        </button>
      </div>

      {error && (
        <div className="p-2 text-xs text-red-500 bg-red-50 rounded-md">
          {getMessage("performanceError")}
        </div>
      )}

      {performance && (
        <div className="w-full">
          <div className="grid grid-cols-1 gap-1">
            {performanceItems.map((metric) => (
              <div
                key={metric.key}
                className="flex justify-between items-center bg-gray-50 rounded-md px-1.5 py-0.5"
              >
                <span className="text-xs text-gray-600">{metric.label}:</span>
                <span className="text-xs font-medium">
                  {metric.format
                    ? metric.format(performance)
                    : typeof performance[
                        metric.key as keyof PagePerformance
                      ] === "number"
                    ? `${(
                        performance[
                          metric.key as keyof PagePerformance
                        ] as number
                      ).toFixed(0)}${metric.unit}`
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformancePanel;
