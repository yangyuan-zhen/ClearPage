import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CacheClearButton from "../CacheClearButton";
import { clearDomainCache } from "../../utils/cacheUtils";

// 模拟fetch API如果在测试环境中不可用
if (typeof global.fetch !== "function") {
  global.fetch = jest.fn().mockImplementation((url) => {
    if (url.includes("zh_CN.json")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            clearCache: "清除缓存",
            dataTypes: "数据类型",
            cache: "缓存",
            cookie: "Cookie",
            localStorage: "本地存储",
            success: "成功清除{domain}的缓存",
            clearing: "正在清除...",
            clear: "清除",
            currentDomain: "当前域名: {domain}",
          }),
      });
    } else if (url.includes("en.json")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            clearCache: "Clear Cache",
            dataTypes: "Data Types",
            cache: "Cache",
            cookie: "Cookie",
            localStorage: "Local Storage",
            success: "Successfully cleared cache for {domain}",
            clearing: "Clearing...",
            clear: "Clear",
            currentDomain: "Current domain: {domain}",
          }),
      });
    }
    return Promise.reject(new Error("Not found"));
  });
}

// 模拟chrome API
if (!global.chrome) {
  global.chrome = {
    runtime: {
      getURL: jest.fn(
        (path) => `chrome-extension://abcdefghijklmnopqrstuvwxyz/${path}`
      ),
      sendMessage: jest.fn(),
      connect: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(),
        hasListeners: jest.fn(),
        dispatch: jest.fn(),
      },
    },
    tabs: {
      query: jest.fn(),
    },
  } as unknown as typeof chrome;
}

jest.mock("../../utils/cacheUtils");

describe("CacheClearButton", () => {
  beforeEach(() => {
    // 重置所有的 mock
    jest.clearAllMocks();

    // Mock chrome.tabs.query
    (chrome.tabs.query as jest.Mock).mockImplementation(() =>
      Promise.resolve([{ url: "https://example.com/page" }])
    );

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => "zh_CN"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 1,
        key: jest.fn(),
      },
      writable: true,
    });
  });

  it("显示当前域名", async () => {
    render(<CacheClearButton />);

    // 等待当前域名文本出现
    const domainText = await screen.findByTestId("domain-text");
    expect(domainText).toHaveTextContent("example.com");
  });

  it("清除缓存成功时显示成功消息", async () => {
    (clearDomainCache as jest.Mock).mockResolvedValue({ success: true });
    render(<CacheClearButton />);

    // 等待按钮可用
    const button = await screen.findByRole("button");
    fireEvent.click(button);

    // 等待成功消息
    const message = await screen.findByTestId("status-message");
    expect(message).toHaveTextContent(/成功/);
  });

  it("清除缓存失败时显示错误消息", async () => {
    (clearDomainCache as jest.Mock).mockResolvedValue({
      success: false,
      error: "测试错误",
    });
    render(<CacheClearButton />);

    // 等待按钮可用
    const button = await screen.findByRole("button");
    fireEvent.click(button);

    // 等待错误消息
    const message = await screen.findByTestId("status-message");
    expect(message).toHaveTextContent(/测试错误/);
  });

  it("可以选择和取消选择数据类型", async () => {
    render(<CacheClearButton />);

    // 等待复选框出现
    const cacheCheckbox = await screen.findByLabelText("缓存");
    const cookieCheckbox = await screen.findByLabelText("Cookie");

    // 验证初始状态
    expect(cacheCheckbox).toBeChecked();
    expect(cookieCheckbox).not.toBeChecked();

    // 选择 Cookie
    fireEvent.click(cookieCheckbox);
    expect(cookieCheckbox).toBeChecked();

    // 取消选择缓存
    fireEvent.click(cacheCheckbox);
    expect(cacheCheckbox).not.toBeChecked();
  });
});
