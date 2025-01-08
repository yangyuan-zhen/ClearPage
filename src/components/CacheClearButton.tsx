import React, { useState, useEffect } from "react";
import { clearDomainCache } from "../utils/cacheUtils";
import type { DataType } from "../types";

const CacheClearButton: React.FC = () => {
  const [currentDomain, setCurrentDomain] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>(["cache"]);

  const dataTypeOptions: { value: DataType; label: string }[] = [
    { value: "cache", label: "缓存" },
    { value: "cookies", label: "Cookie" },
    { value: "localStorage", label: "本地存储" },
    { value: "serviceWorkers", label: "Service Worker" },
  ];

  const sensitiveDataTypes: DataType[] = [
    "cookies",
    "localStorage",
    "passwords",
  ];

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

  const handleTypeChange = (type: DataType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearCache = async () => {
    if (hasSensitiveData) {
      const confirmMessage = [
        "警告：您选择了以下敏感数据：",
        selectedTypes
          .filter((type) => sensitiveDataTypes.includes(type))
          .map(
            (type) => dataTypeOptions.find((opt) => opt.value === type)?.label
          )
          .join(", "),
        "\n清除这些数据可能会导致：",
        "- 网站登录状态丢失",
        "- 保存的表单数据消失",
        "- 需要重新登录网站",
        "\n页面将会自动刷新，确定要继续吗？",
      ].join("\n");

      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await clearDomainCache({
        domain: currentDomain,
        dataTypes: selectedTypes,
      });

      if (result.success) {
        setMessage("清除成功！");
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.id) {
          await chrome.tabs.reload(tab.id);
        }
      } else {
        setMessage(`清除失败: ${result.error}`);
      }
    } catch (error) {
      setMessage("清除时发生错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="px-3 py-2 border rounded-md bg-gray-50">
        当前域名: <span data-testid="domain-text">{currentDomain}</span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">选择要清除的数据：</p>
        <div className="flex flex-wrap gap-2">
          {dataTypeOptions.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedTypes.includes(value)}
                onChange={() => handleTypeChange(value)}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {hasSensitiveData && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
          ⚠️ 注意：清除选中的数据可能会导致登录状态丢失，需要重新登录网站
        </div>
      )}

      <button
        onClick={handleClearCache}
        disabled={isLoading || !currentDomain || selectedTypes.length === 0}
        className={`btn-primary ${
          isLoading || !currentDomain || selectedTypes.length === 0
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        {isLoading ? "清除中..." : "清除数据"}
      </button>

      {message && (
        <p
          data-testid="status-message"
          className={`text-sm ${
            message.includes("失败") ? "text-red-500" : "text-green-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default CacheClearButton;
