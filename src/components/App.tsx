import React from "react";
import CacheClearButton from "./CacheClearButton";
import PerformancePanel from "./PerformancePanel";

const App: React.FC = () => {
  // 打开落地页的函数
  const openLandingPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("landing.html") });
  };

  return (
    <div className="min-w-[350px] min-h-[200px] bg-white">
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
      <main className="flex flex-col gap-6 p-4">
        <CacheClearButton />
        <div className="pt-4 border-t">
          <PerformancePanel />
        </div>
      </main>
    </div>
  );
};

export default App;
