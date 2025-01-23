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
    {
      key: "storageUsage",
      label: "存储用量",
      format: (p: PagePerformance) => {
        const { cache, indexedDB, serviceWorker, total } = p.storageUsage;
        return `${cache}MB / ${total}MB`;
      },
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
        <>
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium">存储用量分布</h3>
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {/* 背景圆环 */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#eee"
                  strokeWidth="10"
                />
                {/* 缓存使用量 */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="10"
                  strokeDasharray={`${
                    (performance.storageUsage.cache /
                      performance.storageUsage.total) *
                    283
                  } 283`}
                />
                {/* IndexedDB使用量 */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="10"
                  strokeDasharray={`${
                    (performance.storageUsage.indexedDB /
                      performance.storageUsage.total) *
                    283
                  } 283`}
                  strokeDashoffset={
                    -(
                      (performance.storageUsage.cache /
                        performance.storageUsage.total) *
                      283
                    )
                  }
                />
                {/* Service Worker使用量 */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#EAB308"
                  strokeWidth="10"
                  strokeDasharray={`${
                    (performance.storageUsage.serviceWorker /
                      performance.storageUsage.total) *
                    283
                  } 283`}
                  strokeDashoffset={
                    -(
                      ((performance.storageUsage.cache +
                        performance.storageUsage.indexedDB) /
                        performance.storageUsage.total) *
                      283
                    )
                  }
                />
              </svg>
              <div className="flex absolute inset-0 justify-center items-center text-xs">
                {performance.storageUsage.total}MB
              </div>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex gap-2 items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
                <span>缓存: {performance.storageUsage.cache}MB</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
                <span>IndexedDB: {performance.storageUsage.indexedDB}MB</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-sm"></span>
                <span>
                  Service Worker: {performance.storageUsage.serviceWorker}MB
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {performanceMetrics.map((metric) => (
              <div key={metric.key} className="p-2 bg-gray-50 rounded-md">
                <span className="text-gray-600">{metric.label}</span>
                <p className="font-medium">
                  {metric.format
                    ? metric.format(performance)
                    : typeof performance[
                        metric.key as keyof PagePerformance
                      ] === "number"
                    ? `${(
                        performance[
                          metric.key as keyof PagePerformance
                        ] as number
                      ).toFixed(2)}${metric.unit}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PerformancePanel;
