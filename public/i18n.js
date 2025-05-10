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