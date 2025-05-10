import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

// 创建统一的翻译表
const translations: {
  [key: string]: {
    [lang: string]: string;
  };
} = {
  // 导航相关
  clearData: {
    "zh-CN": "清理数据",
    en: "Clear Data",
  },
  performanceCheck: {
    "zh-CN": "性能检测",
    en: "Performance",
  },
  settings: {
    "zh-CN": "设置",
    en: "Settings",
  },
  aboutPlugin: {
    "zh-CN": "关于插件",
    en: "About",
  },
  appTitle: {
    "zh-CN": "网页清理工具",
    en: "Page Cleaner",
  },

  // 清理模式
  smartCleaning: {
    "zh-CN": "智能清理",
    en: "Smart Cleaning",
  },
  advancedCleaning: {
    "zh-CN": "高级清理",
    en: "Advanced Cleaning",
  },

  // 描述文本
  cleanPageDescription: {
    "zh-CN": "清理浏览器缓存和网站数据，提高浏览体验",
    en: "Clean browser cache and website data to improve browsing experience",
  },
  performancePageDescription: {
    "zh-CN": "分析当前页面的加载性能和资源使用情况",
    en: "Analyze the loading performance and resource usage of the current page",
  },
  settingsPageDescription: {
    "zh-CN": "自定义插件的行为和清理规则",
    en: "Customize plugin behavior and cleaning rules",
  },

  // 智能清理面板
  smart_recommendation: {
    "zh-CN": "智能推荐",
    en: "Smart Recommendation",
  },
  hide: {
    "zh-CN": "隐藏",
    en: "Hide",
  },
  show: {
    "zh-CN": "显示",
    en: "Show",
  },
  recommended_data_types: {
    "zh-CN": "建议清理的数据类型",
    en: "Recommended Data Types",
  },
  recommendation_applied: {
    "zh-CN": "已应用",
    en: "Applied",
  },
  apply_recommendation: {
    "zh-CN": "应用建议",
    en: "Apply Recommendation",
  },

  // 高级清理面板
  select_data_types: {
    "zh-CN": "选择要清理的数据类型",
    en: "Select Data Types to Clean",
  },
  select_basic: {
    "zh-CN": "选择基本项",
    en: "Select Basic",
  },
  select_all: {
    "zh-CN": "全选",
    en: "Select All",
  },

  // 数据类型
  cache: {
    "zh-CN": "缓存",
    en: "Cache",
  },
  cookies: {
    "zh-CN": "Cookies",
    en: "Cookies",
  },
  localStorage: {
    "zh-CN": "本地存储",
    en: "Local Storage",
  },
  sessionStorage: {
    "zh-CN": "会话存储",
    en: "Session Storage",
  },
  indexedDB: {
    "zh-CN": "IndexedDB",
    en: "IndexedDB",
  },
  webSQL: {
    "zh-CN": "WebSQL",
    en: "WebSQL",
  },
  formData: {
    "zh-CN": "表单数据",
    en: "Form Data",
  },
  fileSystem: {
    "zh-CN": "文件系统",
    en: "File System",
  },

  // 数据类型描述
  cacheDescription: {
    "zh-CN": "临时存储的页面资源和文件",
    en: "Temporarily stored page resources and files",
  },
  cookiesDescription: {
    "zh-CN": "网站存储的用户识别和偏好数据",
    en: "User identification and preference data stored by websites",
  },
  localStorageDescription: {
    "zh-CN": "永久存储的网站数据",
    en: "Permanently stored website data",
  },
  sessionStorageDescription: {
    "zh-CN": "临时会话数据，关闭标签页后清除",
    en: "Temporary session data, cleared after closing the tab",
  },
  indexedDBDescription: {
    "zh-CN": "结构化数据存储",
    en: "Structured data storage",
  },
  webSQLDescription: {
    "zh-CN": "旧版网站使用的数据库存储",
    en: "Database storage used by legacy websites",
  },
  formDataDescription: {
    "zh-CN": "保存的表单数据",
    en: "Saved form data",
  },
  fileSystemDescription: {
    "zh-CN": "网站保存的文件",
    en: "Files saved by websites",
  },

  // 清理状态和按钮
  cleaning_data_for: {
    "zh-CN": "正在清理数据：",
    en: "Cleaning data for:",
  },
  clearWithSmart: {
    "zh-CN": "智能清理",
    en: "Smart Clean",
  },
  startCleaning: {
    "zh-CN": "开始清理",
    en: "Start Cleaning",
  },
  cleaning: {
    "zh-CN": "正在清理...",
    en: "Cleaning...",
  },
  clearAgain: {
    "zh-CN": "再次清理",
    en: "Clean Again",
  },
  cleaning_complete: {
    "zh-CN": "清理完成",
    en: "Cleaning Complete",
  },
  selected_data_cleared: {
    "zh-CN": "已清理所选数据类型",
    en: "Selected data types have been cleared",
  },
  time_taken: {
    "zh-CN": "耗时",
    en: "Time taken",
  },
  sensitive_data_warning: {
    "zh-CN": "您选择了包含敏感数据的类型。清理后可能需要重新登录此网站。",
    en: "You've selected types that contain sensitive data. You may need to log in again after cleaning.",
  },

  // 之前已有的翻译项
  version: {
    "zh-CN": "版本",
    en: "Version",
  },
};

// 定义上下文类型
interface LanguageContextType {
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  switchLanguage: (lang: string) => void;
}

// 创建上下文
export const LanguageContext = createContext<LanguageContextType>({
  currentLang: "zh-CN",
  setCurrentLang: () => {},
  t: (key: string, fallback = "") => fallback,
  switchLanguage: () => {},
});

// 创建Provider组件
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [currentLang, setCurrentLang] = useState<string>("zh-CN");

  // 初始化语言设置
  useEffect(() => {
    const savedLang = localStorage.getItem("clearpage_language");
    if (savedLang === "zh-CN" || savedLang === "en") {
      setCurrentLang(savedLang);
    } else {
      // 如果没有保存的语言设置，使用浏览器语言
      const browserLang = navigator.language || (navigator as any).userLanguage;
      const lang = browserLang.startsWith("zh") ? "zh-CN" : "en";
      setCurrentLang(lang);
      localStorage.setItem("clearpage_language", lang);
    }
  }, []);

  // 向window对象注册updateReactLanguage函数
  useEffect(() => {
    // 定义全局更新函数，允许从外部更新React组件的语言
    window.updateReactLanguage = (lang: string) => {
      console.log(`从全局调用更新React语言: ${lang}`);
      setCurrentLang(lang);

      // 触发一个自定义事件，通知应用其他部分语言已更改
      const event = new CustomEvent("appLanguageChanged", { detail: { lang } });
      document.dispatchEvent(event);
    };

    return () => {
      // 清理函数
      delete window.updateReactLanguage;
    };
  }, []);

  // 监听从外部触发的语言变化事件
  useEffect(() => {
    const handleLanguageChanged = (event: CustomEvent) => {
      if (
        event.detail &&
        event.detail.lang &&
        event.detail.lang !== currentLang
      ) {
        console.log(`接收到语言变化事件: ${event.detail.lang}`);
        setCurrentLang(event.detail.lang);
      }
    };

    // 添加事件监听器
    document.addEventListener(
      "languageChanged",
      handleLanguageChanged as EventListener
    );

    // 清理函数
    return () => {
      document.removeEventListener(
        "languageChanged",
        handleLanguageChanged as EventListener
      );
    };
  }, [currentLang]);

  // 监听语言变化，更新文档属性
  useEffect(() => {
    if (currentLang) {
      // 更新文档的lang属性
      document.documentElement.setAttribute("lang", currentLang);

      // 如果window.i18n存在，通知它语言变化
      if (typeof window !== "undefined" && window.i18n) {
        window.i18n.switchLanguage(currentLang);
      }
    }
  }, [currentLang]);

  // 翻译函数
  const t = (key: string, fallback = ""): string => {
    // 尝试从Chrome扩展API获取
    if (
      typeof chrome !== "undefined" &&
      chrome.i18n &&
      chrome.i18n.getMessage
    ) {
      const message = chrome.i18n.getMessage(key);
      if (message && message !== "") return message;
    }

    // 从翻译表中获取
    if (translations[key] && translations[key][currentLang]) {
      return translations[key][currentLang];
    }

    // 回退到提供的默认值
    return fallback;
  };

  // 切换语言
  const switchLanguage = (lang: string): void => {
    if (lang !== "zh-CN" && lang !== "en") {
      console.warn(`不支持的语言: ${lang}`);
      return;
    }

    localStorage.setItem("clearpage_language", lang);
    setCurrentLang(lang);

    // 显示通知
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 9999;
    `;
    notification.textContent =
      lang === "zh-CN" ? "语言已切换为中文" : "Language switched to English";
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);

    // 触发一个自定义事件，通知应用其他部分语言已更改
    const event = new CustomEvent("appLanguageChanged", { detail: { lang } });
    document.dispatchEvent(event);

    // 如果window.updateReactLanguage存在（全局传递语言更新的函数），则调用它
    if (window.updateReactLanguage) {
      window.updateReactLanguage(lang);
    }

    // 兼容旧的window.i18n机制
    if (window.i18n && window.i18n.switchLanguage) {
      window.i18n.switchLanguage(lang);
    }

    // 强制页面元素刷新，确保所有组件感知到语言变化
    console.log(`语言已切换为: ${lang}`);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        setCurrentLang,
        t,
        switchLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// 创建自定义Hook以便更容易使用
export const useLanguage = () => useContext(LanguageContext);

// 声明window.i18n接口
declare global {
  interface Window {
    i18n?: {
      switchLanguage: (lang: string) => void;
      applyLanguage: () => void;
      detectUserLanguage: () => string;
      getMessage: (messageId: string, fallback?: string) => string;
      getCurrentLanguage: () => string;
    };
    // 添加用于React和原生JS通信的函数
    updateReactLanguage?: (lang: string) => void;
  }
}
