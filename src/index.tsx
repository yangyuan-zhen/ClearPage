import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import "./styles/tailwind.css";
import "./index.css";

// 初始化i18n
import "./utils/i18n";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
