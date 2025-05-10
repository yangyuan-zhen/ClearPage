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

  // 定义导航项
  const navItems = [
    {
      id: "clean",
      label: "清理数据",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
    {
      id: "performance",
      label: "性能检测",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "设置",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-[500px] min-w-[800px] max-w-[800px] bg-white">
      {/* 侧边栏导航 */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-primary">
            {chrome.i18n.getMessage("appTitle")}
          </h1>
        </div>

        <nav className="mt-6 px-3 flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() =>
                    handleTabChange(
                      item.id as "clean" | "performance" | "settings"
                    )
                  }
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {/* 关于插件按钮 - 移至导航菜单下方 */}
          <div className="mt-8 px-1">
            <button
              onClick={openLandingPage}
              className="flex items-center w-full px-4 py-2.5 text-sm font-medium border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
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
              关于插件
            </button>
          </div>
        </nav>
      </div>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* 页面标题 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {navItems.find((item) => item.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === "clean" &&
                "清理浏览器缓存和网站数据，提高浏览体验"}
              {activeTab === "performance" &&
                "分析当前页面的加载性能和资源使用情况"}
              {activeTab === "settings" && "自定义插件的行为和清理规则"}
            </p>
          </div>

          {/* 根据激活的标签页显示不同组件 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            {activeTab === "clean" && <CacheClearButton />}
            {activeTab === "performance" && (
              <PerformancePanel key={performancePanelKey} />
            )}
            {activeTab === "settings" && <SettingsPanel />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
