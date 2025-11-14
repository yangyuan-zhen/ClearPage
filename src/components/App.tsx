import React, { useState } from "react";
import CacheClearButton from "./CacheClearButton";
import PerformancePanel from "./PerformancePanel";
import SettingsPanel from "./SettingsPanel";
import { useI18n } from "../utils/i18n";

const App: React.FC = () => {
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<
    "clean" | "performance" | "settings"
  >("clean");

  // 性能面板的key，用于控制重新渲染
  const [performancePanelKey, setPerformancePanelKey] = useState<number>(0);

  // 使用i18n钩子
  const { currentLang, t, switchLanguage } = useI18n();

  // 定义导航项
  const navItems = React.useMemo(
    () => [
      {
        id: "clean",
        label: t("clearData", "清理数据"),
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
        label: t("performanceCheck", "性能检测"),
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
        label: t("settings", "设置"),
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
    ],
    [t]
  );

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
    <div className="flex h-[600px] min-w-[520px] max-w-[640px] bg-white">
      {/* 侧边栏导航 */}
      <div className="flex flex-col w-36 border-r sm:w-40 md:w-44 bg-muted border-border">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-slate-900">
            {t("appTitle", "网页清理工具")}
          </h1>
        </div>

        <nav className="flex-1 px-3 mt-6" role="navigation" aria-label={currentLang === "zh_CN" ? "主导航" : "Main Navigation"}>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() =>
                    handleTabChange(
                      item.id as "clean" | "performance" | "settings"
                    )
                  }
                  className={`sidebar-item ${
                    activeTab === item.id ? "sidebar-item-active" : ""
                  }`}
                  aria-current={activeTab === item.id ? "page" : undefined}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {/* 语言切换按钮 */}
          <div className="mt-8">
            <p className="px-2 mb-2 text-xs text-gray-500">
              {currentLang === "zh_CN" ? "语言 / Language" : "Language / 语言"}
            </p>
            <div className="flex px-2 space-x-2">
              <button
                onClick={() => switchLanguage("zh_CN")}
                className={`flex-1 py-2 px-2 text-xs rounded-md ${
                  currentLang === "zh_CN"
                    ? "bg-primary text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                中文
              </button>
              <button
                onClick={() => switchLanguage("en")}
                className={`flex-1 py-2 px-2 text-xs rounded-md ${
                  currentLang === "en"
                    ? "bg-primary text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* 关于插件按钮 */}
          <div className="px-1 mt-8">
            <button
              onClick={openLandingPage}
              className="flex items-center w-full px-4 py-2.5 text-sm font-medium border border-border text-primary rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg
                className="mr-2 w-5 h-5"
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
              {t("aboutPlugin", "关于插件")}
            </button>
          </div>
        </nav>
      </div>

      {/* 主内容区域 */}
      <main className="overflow-y-auto flex-1">
        <div className="p-6">
          {/* 页面标题 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {navItems.find((item) => item.id === activeTab)?.label}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === "clean" &&
                t(
                  "cleanPageDescription",
                  "清理浏览器缓存和网站数据，提高浏览体验"
                )}
              {activeTab === "performance" &&
                t(
                  "performancePageDescription",
                  "分析当前页面的加载性能和资源使用情况"
                )}
              {activeTab === "settings" &&
                t("settingsPageDescription", "自定义插件的行为和清理规则")}
            </p>
          </div>

          {/* 根据激活的标签页显示不同组件 */}
          <div className="p-5 bg-white rounded-lg border border-gray-100 shadow-sm">
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
