import React, { useState, useEffect } from "react";
import { clearDomainCache } from "../utils/cacheUtils";
import type { DataType } from "../types";
import { getMessage } from "../utils/i18n";

interface TimeRangeOption {
  value: string;
  label: string;
  time: number;
}

const CacheClearButton: React.FC = () => {
  const [currentDomain, setCurrentDomain] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>(["cache"]);
  const [clearTime, setClearTime] = useState<number | null>(null);

  const dataTypeOptions: { value: DataType; label: string }[] = [
    { value: "cache", label: getMessage("cache") },
    { value: "cookies", label: getMessage("cookies") },
    { value: "localStorage", label: getMessage("localStorage") },
    { value: "serviceWorkers", label: getMessage("serviceWorker") },
  ];

  const sensitiveDataTypes: DataType[] = ["cookies", "localStorage"];

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

    try {
      const startTime = performance.now();

      const result = await clearDomainCache({
        domain: currentDomain,
        dataTypes: selectedTypes,
      });

      const endTime = performance.now();
      const timeUsed = Math.round(endTime - startTime);
      setClearTime(timeUsed);

      if (result.success) {
        setMessage(getMessage("clearSuccess"));

        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (tab?.id) {
          await chrome.tabs.reload(tab.id);
        }
      } else {
        setMessage(getMessage("clearFailed", [result.error || "未知错误"]));
      }
    } catch (error) {
      console.error("清除失败:", error);
      setMessage(
        `清除失败: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="px-3 py-2 bg-gray-50 rounded-md border">
        {getMessage("currentDomain")}:{" "}
        <span data-testid="domain-text">{currentDomain}</span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{getMessage("selectDataTypes")}</p>
        <div className="flex flex-wrap gap-2">
          {dataTypeOptions.map(({ value, label }) => (
            <label
              key={value}
              className="flex gap-2 items-center px-3 py-2 rounded-md border cursor-pointer hover:bg-gray-50"
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
        <div className="p-3 text-sm text-amber-600 bg-amber-50 rounded-md border border-amber-200">
          {getMessage("sensitiveWarning")}
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
        {isLoading ? getMessage("clearing") : getMessage("clearData")}
      </button>

      {message && (
        <div
          className={`mt-2 text-sm p-2 rounded ${
            message.includes("成功")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
          data-testid="status-message"
        >
          {message}
          {clearTime && message.includes("成功") && (
            <span className="ml-1 text-xs text-gray-500">
              (用时 {clearTime} ms)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CacheClearButton;
