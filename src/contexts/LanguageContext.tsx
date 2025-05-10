import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

// 翻译表
export const translations: { [key: string]: { [lang: string]: string } } = {
  // 导航和标题
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
  appTitle: {
    "zh-CN": "网页清理工具",
    en: "ClearPage",
  },
  aboutPlugin: {
    "zh-CN": "关于插件",
    en: "About",
  },

  // 页面描述
  cleanPageDescription: {
    "zh-CN": "清理浏览器缓存和网站数据，提高浏览体验",
    en: "Clean browser cache and website data to improve browsing experience",
  },
  performancePageDescription: {
    "zh-CN": "分析当前页面的加载性能和资源使用情况",
    en: "Analyze current page loading performance and resource usage",
  },
  settingsPageDescription: {
    "zh-CN": "自定义插件的行为和清理规则",
    en: "Customize plugin behavior and cleaning rules",
  },

  // CacheClearButton组件
  clearCache: {
    "zh-CN": "清除缓存",
    en: "Clear Cache",
  },
  clearingCache: {
    "zh-CN": "正在清除...",
    en: "Clearing...",
  },
  cacheCleared: {
    "zh-CN": "缓存已清除",
    en: "Cache Cleared",
  },
  selectDataTypes: {
    "zh-CN": "选择要清除的数据类型",
    en: "Select Data Types to Clear",
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
  imageCache: {
    "zh-CN": "图片缓存",
    en: "Image Cache",
  },
  clearSelected: {
    "zh-CN": "清除选中项",
    en: "Clear Selected",
  },
  clearAll: {
    "zh-CN": "清除全部",
    en: "Clear All",
  },

  // PerformancePanel组件
  runCheck: {
    "zh-CN": "运行检测",
    en: "Run Check",
  },
  analyzing: {
    "zh-CN": "分析中...",
    en: "Analyzing...",
  },
  overallScore: {
    "zh-CN": "总体评分",
    en: "Overall Score",
  },
  loadTime: {
    "zh-CN": "加载时间",
    en: "Load Time",
  },
  resourceCount: {
    "zh-CN": "资源数量",
    en: "Resource Count",
  },
  resourceSize: {
    "zh-CN": "资源大小",
    en: "Resource Size",
  },
  metrics: {
    "zh-CN": "指标",
    en: "Metrics",
  },
  recommendations: {
    "zh-CN": "建议",
    en: "Recommendations",
  },
  resources: {
    "zh-CN": "资源",
    en: "Resources",
  },
  javascript: {
    "zh-CN": "JavaScript",
    en: "JavaScript",
  },
  css: {
    "zh-CN": "CSS",
    en: "CSS",
  },
  images: {
    "zh-CN": "图片",
    en: "Images",
  },
  other: {
    "zh-CN": "其他",
    en: "Other",
  },

  // SettingsPanel组件
  dataTypes: {
    "zh-CN": "数据类型",
    en: "Data Types",
  },
  rules: {
    "zh-CN": "规则",
    en: "Rules",
  },
  preferences: {
    "zh-CN": "首选项",
    en: "Preferences",
  },
  about: {
    "zh-CN": "关于",
    en: "About",
  },
  addRule: {
    "zh-CN": "添加规则",
    en: "Add Rule",
  },
  domain: {
    "zh-CN": "域名",
    en: "Domain",
  },
  dataType: {
    "zh-CN": "数据类型",
    en: "Data Type",
  },
  action: {
    "zh-CN": "操作",
    en: "Action",
  },
  save: {
    "zh-CN": "保存",
    en: "Save",
  },
  cancel: {
    "zh-CN": "取消",
    en: "Cancel",
  },
  delete: {
    "zh-CN": "删除",
    en: "Delete",
  },
  edit: {
    "zh-CN": "编辑",
    en: "Edit",
  },
  reset: {
    "zh-CN": "重置",
    en: "Reset",
  },
  export: {
    "zh-CN": "导出",
    en: "Export",
  },
  import: {
    "zh-CN": "导入",
    en: "Import",
  },
  automaticCleanup: {
    "zh-CN": "自动清理",
    en: "Automatic Cleanup",
  },
  notificationsEnabled: {
    "zh-CN": "启用通知",
    en: "Enable Notifications",
  },
  cleanupInterval: {
    "zh-CN": "清理间隔",
    en: "Cleanup Interval",
  },
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
  }
}
