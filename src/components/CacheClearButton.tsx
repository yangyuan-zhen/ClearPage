import React, { useState, useEffect } from "react";
import { clearDomainCache } from "../utils/cacheUtils";
import type { DataType, TimeRange } from "../types";
import { getMessage } from "../utils/i18n";

interface TimeRangeOption {
  value: TimeRange;
  label: string;
  time: number;
}

const CacheClearButton: React.FC = () => {
  const [currentDomain, setCurrentDomain] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>(["cache"]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("day");

  const dataTypeOptions: { value: DataType; label: string }[] = [
    { value: "cache", label: getMessage("cache") },
    { value: "cookies", label: getMessage("cookies") },
    { value: "localStorage", label: getMessage("localStorage") },
    { value: "serviceWorkers", label: getMessage("serviceWorker") },
    { value: "history", label: getMessage("history") },
  ];

  const sensitiveDataTypes: DataType[] = ["cookies", "localStorage", "history"];

  const hasSensitiveData = selectedTypes.some((type) =>
    sensitiveDataTypes.includes(type)
  );

  const timeRangeOptions: TimeRangeOption[] = [
    {
      value: "hour" as TimeRange,
      label: getMessage("lastHour"),
      time: 60 * 60 * 1000,
    },
    {
      value: "day" as TimeRange,
      label: getMessage("lastDay"),
      time: 24 * 60 * 60 * 1000,
    },
    {
      value: "week" as TimeRange,
      label: getMessage("lastWeek"),
      time: 7 * 24 * 60 * 60 * 1000,
    },
    {
      value: "month" as TimeRange,
      label: getMessage("lastMonth"),
      time: 30 * 24 * 60 * 60 * 1000,
    },
    { value: "all" as TimeRange, label: getMessage("allTime"), time: 0 },
  ];

  const showTimeRangeSelect = selectedTypes.includes("history");

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

    try {
      const selectedTimeOption = timeRangeOptions.find(
        (opt) => opt.value === selectedTimeRange
      );
      const since = selectedTimeOption
        ? Date.now() - selectedTimeOption.time
        : 0;

      const result = await clearDomainCache({
        domain: currentDomain,
        dataTypes: selectedTypes,
        since: since,
      });

      if (result.success) {
        setMessage(getMessage("clearSuccess"));
        if (
          selectedTypes.some((type) =>
            ["cache", "cookies", "localStorage", "serviceWorkers"].includes(
              type
            )
          )
        ) {
          chrome.tabs.reload();
        }
      } else {
        setMessage(getMessage("clearFailed", result.error || ""));
      }
    } catch (error) {
      setMessage(
        getMessage("clearFailed", error instanceof Error ? error.message : "")
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

      {showTimeRangeSelect && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">选择时间范围</p>
          <div className="flex flex-wrap gap-2">
            {timeRangeOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedTimeRange(value)}
                className={`px-3 py-1 text-sm rounded-md border ${
                  selectedTimeRange === value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

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
        <p
          data-testid="status-message"
          className={`text-sm ${
            message.includes(getMessage("clearFailed"))
              ? "text-red-500"
              : "text-green-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default CacheClearButton;
