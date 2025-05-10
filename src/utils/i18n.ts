import { useEffect, useState } from 'react';

// 定义支持的语言类型
export type Language = 'zh_CN' | 'en';

// 定义翻译对象接口
export interface Translations {
    [key: string]: string;
}

// 定义事件监听器类型
type LanguageChangeListener = (lang: Language) => void;

/**
 * 国际化管理类
 * 负责加载语言包、提供翻译功能和语言切换
 */
class I18nManager {
    private translations: Translations = {};
    private currentLang: Language;
    private listeners: LanguageChangeListener[] = [];
    private isLoading: boolean = false;
    private loadPromise: Promise<void> | null = null;

    constructor() {
        // 从localStorage获取语言设置，如果没有则使用浏览器语言
        const savedLang = localStorage.getItem('clearpage_language') as Language;

        if (savedLang && (savedLang === 'zh_CN' || savedLang === 'en')) {
            this.currentLang = savedLang;
        } else {
            // 检测浏览器语言
            const browserLang = navigator.language || (navigator as any).userLanguage;
            this.currentLang = browserLang.startsWith('zh') ? 'zh_CN' : 'en';
            // 保存检测到的语言
            localStorage.setItem('clearpage_language', this.currentLang);
        }

        // 初始化时加载语言包
        this.loadLanguagePack();
    }

    /**
     * 加载语言包
     * @returns Promise
     */
    private loadLanguagePack(): Promise<void> {
        // 如果已经有加载中的Promise，直接返回
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.isLoading = true;
        this.loadPromise = new Promise<void>((resolve, reject) => {
            try {
                // 检查全局环境中是否存在fetch API
                if (typeof fetch !== 'function') {
                    // 如果fetch不可用，使用备用翻译并解析Promise
                    console.warn('Fetch API not available, using fallback translations');
                    this.translations = this.getFallbackTranslations();
                    this.isLoading = false;
                    resolve();
                    this.notifyListeners();
                    this.loadPromise = null;
                    return;
                }

                // 异步加载语言包
                fetch(chrome.runtime.getURL(`locales/${this.currentLang}.json`))
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to load language file: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        this.translations = data;
                        this.isLoading = false;
                        resolve();
                        // 加载完成后通知所有监听器
                        this.notifyListeners();
                    })
                    .catch(error => {
                        console.error('Failed to load language pack:', error);
                        this.isLoading = false;
                        reject(error);
                        // 加载失败时使用内置的紧急翻译
                        this.translations = this.getFallbackTranslations();
                        // 仍然通知监听器，使界面能够更新
                        this.notifyListeners();
                    })
                    .finally(() => {
                        this.loadPromise = null;
                    });
            } catch (error) {
                console.error('Error in loadLanguagePack:', error);
                this.isLoading = false;
                this.loadPromise = null;
                reject(error);
                // 出错时使用内置的紧急翻译
                this.translations = this.getFallbackTranslations();
                // 仍然通知监听器，使界面能够更新
                this.notifyListeners();
            }
        });

        return this.loadPromise;
    }

    /**
     * 获取翻译文本
     * @param key 翻译键
     * @param fallback 默认值
     * @returns 翻译文本
     */
    public t(key: string, fallback: string = key): string {
        // 如果翻译表中有对应的键，则返回翻译文本
        if (this.translations[key]) {
            return this.translations[key];
        }

        // 否则返回默认值
        return fallback;
    }

    /**
     * 切换语言
     * @param lang 目标语言
     */
    public switchLanguage(lang: Language): void {
        if (lang !== 'zh_CN' && lang !== 'en') {
            console.warn(`Unsupported language: ${lang}, will use default language`);
            return;
        }

        if (this.currentLang === lang) {
            // 如果语言没有变化，不执行切换
            return;
        }

        // 保存语言设置到localStorage
        localStorage.setItem('clearpage_language', lang);
        this.currentLang = lang;

        // 重新加载语言包
        this.loadLanguagePack();

        // 显示语言切换通知
        this.showLanguageChangeNotification(lang);
    }

    /**
     * 获取当前语言
     * @returns 当前语言
     */
    public getCurrentLang(): Language {
        return this.currentLang;
    }

    /**
     * 添加语言变化监听器
     * @param listener 监听器函数
     * @returns 取消监听的函数
     */
    public addLanguageChangeListener(listener: LanguageChangeListener): () => void {
        this.listeners.push(listener);

        // 返回一个函数，用于取消监听
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * 通知所有监听器语言已变化
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            try {
                listener(this.currentLang);
            } catch (error) {
                console.error('Error in language change listener:', error);
            }
        });
    }

    /**
     * 显示语言切换通知
     * @param lang 切换的目标语言
     */
    private showLanguageChangeNotification(lang: Language): void {
        const message = lang === 'zh_CN'
            ? '语言已切换为中文'
            : 'Language switched to English';

        const notification = document.createElement('div');
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
        notification.textContent = message;
        document.body.appendChild(notification);

        // 3秒后移除通知
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    /**
     * 获取紧急备用翻译
     * 当无法加载语言包时使用
     * @returns 备用翻译对象
     */
    private getFallbackTranslations(): Translations {
        // 返回最基本的翻译，确保界面至少能正常显示
        return this.currentLang === 'zh_CN'
            ? {
                // 导航相关
                clearData: "清理数据",
                performanceCheck: "性能检测",
                settings: "设置",
                aboutPlugin: "关于插件",
                appTitle: "网页清理工具",

                // 清理模式
                smartCleaning: "智能清理",
                advancedCleaning: "高级清理",

                // 按钮文本
                startCleaning: "开始清理",
                clearWithSmart: "智能清理",
                clearAgain: "再次清理",
                cleaning: "正在清理...",
                try_again: "重试",
                error: "错误"
            }
            : {
                // 导航相关
                clearData: "Clear Data",
                performanceCheck: "Performance",
                settings: "Settings",
                aboutPlugin: "About",
                appTitle: "Page Cleaner",

                // 清理模式
                smartCleaning: "Smart Cleaning",
                advancedCleaning: "Advanced Cleaning",

                // 按钮文本
                startCleaning: "Start Cleaning",
                clearWithSmart: "Smart Clean",
                clearAgain: "Clean Again",
                cleaning: "Cleaning...",
                try_again: "Try Again",
                error: "Error"
            };
    }
}

// 创建单例实例
export const i18n = new I18nManager();

/**
 * React Hook，用于在组件中使用国际化功能
 * @returns 翻译函数和当前语言
 */
export function useI18n() {
    const [currentLang, setCurrentLang] = useState<Language>(i18n.getCurrentLang());

    useEffect(() => {
        // 添加语言变化监听器
        const unsubscribe = i18n.addLanguageChangeListener((lang) => {
            setCurrentLang(lang);
        });

        // 组件卸载时取消监听
        return unsubscribe;
    }, []);

    return {
        t: (key: string, fallback?: string) => i18n.t(key, fallback),
        currentLang,
        switchLanguage: (lang: Language) => i18n.switchLanguage(lang),
    };
}

// 导出单例实例和相关工具
export default i18n; 