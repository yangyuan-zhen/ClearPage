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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">页面性能检测</h2>
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="btn-secondary text-sm"
        >
          {isLoading ? "检测中..." : "检测性能"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {performance && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-gray-50 rounded-md">
            <span className="text-gray-600">DNS 解析</span>
            <p className="font-medium">{performance.dnsTime.toFixed(2)}ms</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-md">
            <span className="text-gray-600">TCP 连接</span>
            <p className="font-medium">{performance.tcpTime.toFixed(2)}ms</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-md">
            <span className="text-gray-600">请求响应</span>
            <p className="font-medium">
              {performance.requestTime.toFixed(2)}ms
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded-md">
            <span className="text-gray-600">DOM 解析</span>
            <p className="font-medium">{performance.domTime.toFixed(2)}ms</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-md">
            <span className="text-gray-600">总加载时间</span>
            <p className="font-medium">{performance.loadTime.toFixed(2)}ms</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-md">
            <span className="text-gray-600">资源数量/大小</span>
            <p className="font-medium">
              {performance.resourceCount}个 /{" "}
              {performance.resourceSize.toFixed(2)}KB
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformancePanel;
