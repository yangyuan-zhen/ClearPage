import React from "react";
import CacheClearButton from "./CacheClearButton";
import PerformancePanel from "./PerformancePanel";

const App: React.FC = () => {
  return (
    <div className="min-w-[350px] min-h-[200px] bg-white">
      <header className="bg-primary text-white p-4">
        <h1 className="text-lg font-bold">缓存清理工具</h1>
      </header>
      <main className="p-4 flex flex-col gap-6">
        <CacheClearButton />
        <div className="border-t pt-4">
          <PerformancePanel />
        </div>
      </main>
    </div>
  );
};

export default App;
