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

  const performanceMetrics = [
    { key: "dnsTime", label: getMessage("dnsTime"), unit: "ms" },
    { key: "tcpTime", label: getMessage("tcpTime"), unit: "ms" },
    { key: "requestTime", label: getMessage("requestTime"), unit: "ms" },
    { key: "domTime", label: getMessage("domTime"), unit: "ms" },
    { key: "loadTime", label: getMessage("loadTime"), unit: "ms" },
    {
      key: "resource",
      label: getMessage("resourceInfo"),
      format: (p: PagePerformance) =>
        `${p.resourceCount}个 / ${p.resourceSize.toFixed(2)}KB`,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">
          {getMessage("performanceCheck")}
        </h2>
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="text-sm btn-secondary"
        >
          {isLoading ? getMessage("checking") : getMessage("checkPerformance")}
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {getMessage("performanceError")}
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
