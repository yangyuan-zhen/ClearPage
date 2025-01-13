import React from "react";
import CacheClearButton from "./CacheClearButton";
import PerformancePanel from "./PerformancePanel";

const App: React.FC = () => {
  return (
    <div className="min-w-[350px] min-h-[200px] bg-white">
      <header className="p-4 text-white bg-primary">
        <h1 className="text-lg font-bold">
          {chrome.i18n.getMessage("appTitle")}
        </h1>
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
