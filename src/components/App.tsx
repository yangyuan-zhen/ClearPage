import React, { useState } from "react";
import CacheClearButton from "./CacheClearButton";
import PerformancePanel from "./PerformancePanel";
import SettingsPanel from "./SettingsPanel";

const App: React.FC = () => {
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<
    "clean" | "performance" | "settings"
  >("clean");

  // 性能面板的key，用于控制重新渲染
  const [performancePanelKey, setPerformancePanelKey] = useState<number>(0);

  // 打开落地页的函数
  const openLandingPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("landing.html") });
  };

  // 切换到性能检测标签时触发重新渲染
  const handleTabChange = (tab: "clean" | "performance" | "settings") => {
    setActiveTab(tab);
    if (tab === "performance") {
      // 更新key以强制PerformancePanel重新渲染
      setPerformancePanelKey((prevKey) => prevKey + 1);
    }
  };

  return (
    <div className="min-w-[450px] max-w-[500px] min-h-[200px] bg-white">
      <header className="flex justify-between items-center p-4 text-white bg-primary">
        <h1 className="text-lg font-bold">
          {chrome.i18n.getMessage("appTitle")}
        </h1>
        <button
          onClick={openLandingPage}
          className="px-3 py-1 text-sm bg-white rounded transition-colors text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
        >
          关于插件
        </button>
      </header>

      {/* 标签导航 */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "clean"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("clean")}
        >
          清理数据
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "performance"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("performance")}
        >
          性能检测
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "settings"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("settings")}
        >
          设置
        </button>
      </div>

      <main className="flex flex-col gap-6 p-4">
        {/* 根据激活的标签页显示不同组件 */}
        {activeTab === "clean" && <CacheClearButton />}
        {activeTab === "performance" && (
          <div className="pt-0">
            <PerformancePanel key={performancePanelKey} />
          </div>
        )}
        {activeTab === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
};

export default App;
