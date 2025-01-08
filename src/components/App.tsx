import React from "react";
import CacheClearButton from "./CacheClearButton";

const App: React.FC = () => {
  return (
    <div className="min-w-[300px] min-h-[200px] bg-white">
      <header className="bg-primary text-white p-4">
        <h1 className="text-lg font-bold">缓存清理工具</h1>
      </header>
      <main className="p-4">
        <CacheClearButton />
      </main>
    </div>
  );
};

export default App;
