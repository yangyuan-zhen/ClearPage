/**
 * ClearPage 国际化处理脚本
 * 用于处理多语言支持和语言切换功能
 */

// i18n.js - 国际化处理脚本
(function () {
    // 保存所有需要国际化的元素引用
    let i18nElements = [];

    // 检测用户语言
    function detectUserLanguage() {
        try {
            // 首先检查本地存储中的语言设置
            const savedLanguage = localStorage.getItem('clearpage_language');
            if (savedLanguage && (savedLanguage === 'zh-CN' || savedLanguage === 'en')) {
                return savedLanguage;
            }

            // 如果没有保存的语言设置，使用浏览器语言
            const browserLang = navigator.language || navigator.userLanguage;
            const lang = browserLang.startsWith('zh') ? 'zh-CN' : 'en';

            // 保存检测到的语言
            localStorage.setItem('clearpage_language', lang);

            return lang;
        } catch (error) {
            console.warn('语言检测失败', error);
            return 'en'; // 默认使用英文
        }
    }

    // 获取消息文本
    function getMessage(messageId, fallback = '') {
        try {
            // 获取当前语言
            const currentLang = getCurrentLanguage();

            // 1. 尝试从Chrome扩展API获取
            if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
                const message = chrome.i18n.getMessage(messageId);
                if (message && message !== '') return message;
            }

            // 2. 从内置翻译表中获取
            const translations = {
                // 导航和标题
                "clearData": {
                    "zh-CN": "清理数据",
                    "en": "Clear Data"
                },
                "performanceCheck": {
                    "zh-CN": "性能检测",
                    "en": "Performance"
                },
                "settings": {
                    "zh-CN": "设置",
                    "en": "Settings"
                },
                "appTitle": {
                    "zh-CN": "网页清理工具",
                    "en": "ClearPage"
                },
                "aboutPlugin": {
                    "zh-CN": "关于插件",
                    "en": "About"
                },

                // 页面描述
                "cleanPageDescription": {
                    "zh-CN": "清理浏览器缓存和网站数据，提高浏览体验",
                    "en": "Clean browser cache and website data to improve browsing experience"
                },
                "performancePageDescription": {
                    "zh-CN": "分析当前页面的加载性能和资源使用情况",
                    "en": "Analyze current page loading performance and resource usage"
                },
                "settingsPageDescription": {
                    "zh-CN": "自定义插件的行为和清理规则",
                    "en": "Customize plugin behavior and cleaning rules"
                },

                // CacheClearButton组件
                "cache": {
                    "zh-CN": "缓存",
                    "en": "Cache"
                },
                "cacheDescription": {
                    "zh-CN": "临时存储的页面资源和文件",
                    "en": "Temporary stored page resources and files"
                },
                "cookies": {
                    "zh-CN": "Cookies",
                    "en": "Cookies"
                },
                "cookiesDescription": {
                    "zh-CN": "网站存储的用户识别和偏好数据",
                    "en": "User identification and preference data stored by websites"
                },
                "localStorage": {
                    "zh-CN": "本地存储",
                    "en": "Local Storage"
                },
                "localStorageDescription": {
                    "zh-CN": "永久存储的网站数据",
                    "en": "Permanently stored website data"
                },
                "sessionStorage": {
                    "zh-CN": "会话存储",
                    "en": "Session Storage"
                },
                "sessionStorageDescription": {
                    "zh-CN": "临时会话数据，关闭标签页后清除",
                    "en": "Temporary session data, cleared after closing the tab"
                },
                "indexedDB": {
                    "zh-CN": "IndexedDB",
                    "en": "IndexedDB"
                },
                "indexedDBDescription": {
                    "zh-CN": "结构化数据存储",
                    "en": "Structured data storage"
                },
                "webSQL": {
                    "zh-CN": "WebSQL",
                    "en": "WebSQL"
                },
                "webSQLDescription": {
                    "zh-CN": "旧版网站使用的数据库存储",
                    "en": "Database storage used by legacy websites"
                },
                "formData": {
                    "zh-CN": "表单数据",
                    "en": "Form Data"
                },
                "formDataDescription": {
                    "zh-CN": "保存的表单数据",
                    "en": "Saved form data"
                },
                "fileSystem": {
                    "zh-CN": "文件系统",
                    "en": "File System"
                },
                "fileSystemDescription": {
                    "zh-CN": "网站保存的文件",
                    "en": "Files saved by websites"
                },
                "smartCleaning": {
                    "zh-CN": "智能清理",
                    "en": "Smart Cleaning"
                },
                "advancedCleaning": {
                    "zh-CN": "高级清理",
                    "en": "Advanced Cleaning"
                },
                "cleaning": {
                    "zh-CN": "正在清理...",
                    "en": "Cleaning..."
                },
                "clearAgain": {
                    "zh-CN": "再次清理",
                    "en": "Clean Again"
                },
                "clearWithSmart": {
                    "zh-CN": "智能清理",
                    "en": "Smart Clean"
                },
                "startCleaning": {
                    "zh-CN": "开始清理",
                    "en": "Start Cleaning"
                },

                // Performance Panel
                "runCheck": {
                    "zh-CN": "运行检测",
                    "en": "Run Check"
                },
                "metrics": {
                    "zh-CN": "指标",
                    "en": "Metrics"
                },
                "recommendations": {
                    "zh-CN": "建议",
                    "en": "Recommendations"
                },
                "resources": {
                    "zh-CN": "资源",
                    "en": "Resources"
                }
            };

            if (translations[messageId] && translations[messageId][currentLang]) {
                return translations[messageId][currentLang];
            }

            // 3. 回退到提供的默认值
            return fallback;
        } catch (error) {
            console.warn(`获取消息失败: ${messageId}`, error);
            return fallback;
        }
    }

    // 获取当前语言
    function getCurrentLanguage() {
        return localStorage.getItem('clearpage_language') || detectUserLanguage();
    }

    // 切换语言
    function switchLanguage(lang) {
        if (lang !== 'zh-CN' && lang !== 'en') {
            console.warn(`不支持的语言: ${lang}，将使用默认语言`);
            return;
        }

        // 保存语言设置
        localStorage.setItem('clearpage_language', lang);

        // 更新HTML文档的lang属性
        const htmlElement = document.getElementById('html-document');
        if (htmlElement) {
            htmlElement.setAttribute('lang', lang);
        } else {
            document.documentElement.setAttribute('lang', lang);
        }

        // 应用语言
        applyLanguage();

        // 显示切换成功通知
        showLanguageNotification(lang);

        // 通知React组件语言已更改（如果需要）
        const event = new CustomEvent('languageChanged', { detail: { language: lang } });
        document.dispatchEvent(event);

        return lang;
    }

    // 显示语言切换通知
    function showLanguageNotification(lang) {
        // 查找现有通知或创建新通知
        let notification = document.getElementById('language-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'language-notification';
            notification.style.cssText = `
                display: none;
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
            document.body.appendChild(notification);
        }

        // 更新通知内容并显示
        notification.textContent = lang === 'zh-CN'
            ? '语言已切换为中文'
            : 'Language switched to English';
        notification.style.display = 'block';

        // 3秒后隐藏通知
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // 应用语言到页面
    function applyLanguage() {
        const currentLang = getCurrentLanguage();

        // 缓存所有带有data-i18n属性的元素
        i18nElements = document.querySelectorAll('[data-i18n]');

        // 更新每个元素的文本
        i18nElements.forEach(element => {
            const messageId = element.getAttribute('data-i18n');
            if (!messageId) return;

            const fallback = element.textContent || '';
            const translatedText = getMessage(messageId, fallback);

            element.textContent = translatedText;
        });

        // 返回当前语言
        return currentLang;
    }

    // 初始化函数
    function init() {
        // 检测语言并设置HTML文档的lang属性
        const currentLang = detectUserLanguage();
        const htmlElement = document.getElementById('html-document') || document.documentElement;
        htmlElement.setAttribute('lang', currentLang);

        // 应用语言翻译
        applyLanguage();

        // 创建MutationObserver来监听DOM变化
        const observer = new MutationObserver(mutations => {
            // 当DOM变化时，检查是否有新的需要翻译的元素
            const newElements = document.querySelectorAll('[data-i18n]:not([data-i18n-processed])');
            if (newElements.length > 0) {
                newElements.forEach(element => {
                    const messageId = element.getAttribute('data-i18n');
                    if (!messageId) return;

                    const fallback = element.textContent || '';
                    const translatedText = getMessage(messageId, fallback);

                    element.textContent = translatedText;
                    element.setAttribute('data-i18n-processed', 'true');
                });
            }
        });

        // 配置观察器
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-i18n']
        });
    }

    // 在页面加载完成后自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 监听存储变化，以便在其他窗口改变语言时更新
    window.addEventListener('storage', event => {
        if (event.key === 'clearpage_language') {
            applyLanguage();
        }
    });

    // 暴露全局API
    window.i18n = {
        detectUserLanguage,
        getMessage,
        switchLanguage,
        applyLanguage,
        getCurrentLanguage,
        init
    };
})(); 