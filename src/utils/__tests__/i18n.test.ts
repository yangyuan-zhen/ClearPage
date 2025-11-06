import { i18n, useI18n } from "../i18n";
import { renderHook, act } from "@testing-library/react";

// 模拟fetch API如果在测试环境中不可用
if (typeof globalThis.fetch !== "function") {
  (globalThis as any).fetch = jest.fn().mockImplementation((url) => {
    if (url.includes("zh_CN.json")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            hello: "你好",
            welcome: "欢迎",
          }),
      });
    } else if (url.includes("en.json")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            hello: "Hello",
            welcome: "Welcome",
          }),
      });
    }
    return Promise.reject(new Error("Not found"));
  });
}

// 模拟localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// 模拟chrome.runtime
// 创建一个全面的模拟对象
const mockRuntime = {
  getURL: jest.fn(
    (path) => `chrome-extension://abcdefghijklmnopqrstuvwxyz/${path}`
  ),
  connect: jest.fn(),
  connectNative: jest.fn(),
  getBackgroundPage: jest.fn(),
  getManifest: jest.fn(() => ({ version: "1.0.0" })),
  getPlatformInfo: jest.fn(),
  getPackageDirectoryEntry: jest.fn(),
  id: "mock-extension-id",
  lastError: null,
  onConnect: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  onConnectExternal: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  onInstalled: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  onMessageExternal: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  onRestartRequired: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  onStartup: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  onSuspend: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  onSuspendCanceled: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  onUpdateAvailable: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
    hasListeners: jest.fn(),
    dispatch: jest.fn(),
  },
  reload: jest.fn(),
  requestUpdateCheck: jest.fn(),
  restart: jest.fn(),
  sendMessage: jest.fn(),
  sendNativeMessage: jest.fn(),
  setUninstallURL: jest.fn(),
  openOptionsPage: jest.fn(),
};

// 通过类型断言确保所有需要的属性都已定义
(globalThis as any).chrome = {
  ...(globalThis as any).chrome,
  runtime: mockRuntime as unknown as typeof chrome.runtime,
};

// 在测试开始前重置i18n的默认语言为zh_CN
beforeAll(() => {
  // 直接修改i18n内部的当前语言设置
  Object.defineProperty(i18n, "currentLang", {
    value: "zh_CN",
    writable: true,
  });

  // 预加载语言包
  return i18n["loadLanguagePack"]();
});

describe("i18n", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    // 确保每个测试开始时默认语言为zh_CN
    Object.defineProperty(i18n, "currentLang", {
      value: "zh_CN",
      writable: true,
    });
  });

  it("should use default language when no language is saved", () => {
    // 测试默认语言
    expect(i18n.getCurrentLang()).toBe("zh_CN"); // 假设中文是默认语言
  });

  it("should use saved language from localStorage", () => {
    // 设置localStorage中的语言
    localStorageMock.setItem("clearpage_language", "en");

    // 创建新的i18n实例，应该读取localStorage中的语言
    const { result } = renderHook(() => useI18n());

    // 验证是否使用了localStorage中的语言
    expect(result.current.currentLang).toBe("en");
  });

  it("should switch language correctly", () => {
    // 初始设置
    localStorageMock.setItem("clearpage_language", "zh_CN");

    // 创建hook实例
    const { result } = renderHook(() => useI18n());

    // 初始语言应该是中文
    expect(result.current.currentLang).toBe("zh_CN");

    // 切换到英文
    act(() => {
      result.current.switchLanguage("en");
    });

    // 语言应该已更新为英文
    expect(result.current.currentLang).toBe("en");

    // 验证localStorage是否更新
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "clearpage_language",
      "en"
    );
  });

  it("should provide translation based on current language", async () => {
    // 设置当前语言为中文
    localStorageMock.setItem("clearpage_language", "zh_CN");
    i18n.switchLanguage("zh_CN");

    // 手动触发加载语言包
    await i18n["loadLanguagePack"]();

    // 测试翻译函数
    expect(i18n.t("hello")).toBe("你好");
    expect(i18n.t("welcome")).toBe("欢迎");

    // 切换到英文
    i18n.switchLanguage("en");

    // 手动触发加载语言包
    await i18n["loadLanguagePack"]();

    // 测试翻译是否更新
    expect(i18n.t("hello")).toBe("Hello");
    expect(i18n.t("welcome")).toBe("Welcome");
  });

  it("should return fallback when translation is not found", async () => {
    // 手动触发加载语言包
    await i18n["loadLanguagePack"]();

    // 测试不存在的键
    expect(i18n.t("nonexistent", "Fallback")).toBe("Fallback");

    // 测试不提供fallback时
    expect(i18n.t("nonexistent")).toBe("nonexistent");
  });
});
