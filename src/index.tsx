import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import "./styles/tailwind.css";
import "./index.css";

// 初始化i18n
import "./utils/i18n";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
