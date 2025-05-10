import React, { useState, useEffect } from "react";
import { DataType } from "../types";
import { useI18n } from "../utils/i18n";

// 清理规则接口定义
interface CleaningRule {
  id: string;
  name: string;
  domain: string;
  dataTypes: DataType[];
}

// 默认清理规则
const defaultRules: CleaningRule[] = [
  {
    id: "rule1",
    name: "社交媒体网站",
    domain: "*.weibo.com,*.facebook.com,*.twitter.com",
    dataTypes: ["cache", "cookies"],
  },
  {
    id: "rule2",
    name: "视频网站",
    domain: "*.bilibili.com,*.youtube.com,*.iqiyi.com",
    dataTypes: ["cache", "cookies", "sessionStorage"],
  },
  {
    id: "rule3",
    name: "购物网站",
    domain: "*.taobao.com,*.jd.com,*.amazon.com",
    dataTypes: ["cache"],
  },
];

// 保存清理规则到 Chrome 存储
const saveRules = async (rules: CleaningRule[]): Promise<void> => {
  await chrome.storage.sync.set({ cleaningRules: rules });
};

// 从 Chrome 存储加载清理规则
const loadRules = async (): Promise<CleaningRule[]> => {
  const data = await chrome.storage.sync.get("cleaningRules");
  return data.cleaningRules || defaultRules;
};

const SettingsPanel: React.FC = () => {
  const { t, currentLang } = useI18n();

  const [rules, setRules] = useState<CleaningRule[]>([]);
  const [editingRule, setEditingRule] = useState<CleaningRule | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"rules" | "preferences" | "about">(
    "rules"
  );
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // 所有支持的数据类型及其显示名称
  const availableDataTypes: {
    value: DataType;
    label: string;
    description: string;
  }[] = [
    {
      value: "cache",
      label: "缓存",
      description: "网站图像、脚本和其他媒体文件的临时存储",
    },
    {
      value: "cookies",
      label: "Cookie",
      description: "网站保存的登录状态、偏好设置等信息",
    },
    {
      value: "localStorage",
      label: "本地存储",
      description: "网站在您浏览器中存储的持久数据",
    },
    {
      value: "sessionStorage",
      label: "会话存储",
      description: "本次会话中网站临时存储的数据",
    },
    {
      value: "indexedDB",
      label: "IndexedDB数据库",
      description: "网站存储的结构化数据",
    },
    {
      value: "webSQL",
      label: "WebSQL数据库",
      description: "旧版本网站使用的数据库存储",
    },
    {
      value: "fileSystem",
      label: "文件系统存储",
      description: "网站在您设备上存储的文件",
    },
    {
      value: "formData",
      label: "表单数据",
      description: "保存的表单输入和自动完成数据",
    },
    {
      value: "serviceWorkers",
      label: "服务工作线程",
      description: "网站的后台脚本，可能会导致缓存问题",
    },
  ];

  // 加载已保存的规则
  useEffect(() => {
    const fetchRules = async () => {
      const savedRules = await loadRules();
      setRules(savedRules);
    };
    fetchRules();
  }, []);

  // 保存规则的变更
  useEffect(() => {
    if (rules.length > 0) {
      saveRules(rules);
    }
  }, [rules]);

  // 显示通知
  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // 3秒后自动消失
  };

  // 添加新规则
  const addRule = () => {
    const newRule: CleaningRule = {
      id: `rule${Date.now()}`,
      name: "",
      domain: "",
      dataTypes: ["cache"],
    };
    setEditingRule(newRule);
    setIsEditing(true);
  };

  // 编辑现有规则
  const editRule = (rule: CleaningRule) => {
    setEditingRule({ ...rule });
    setIsEditing(true);
  };

  // 删除规则
  const deleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
    showNotification("规则已删除", "success");
  };

  // 保存编辑中的规则
  const saveEditingRule = () => {
    if (!editingRule) return;

    // 验证必填字段
    if (!editingRule.name || !editingRule.domain) {
      showNotification("规则名称和域名不能为空", "error");
      return;
    }

    if (editingRule.dataTypes.length === 0) {
      showNotification("请至少选择一种数据类型", "error");
      return;
    }

    const updatedRules = isEditing
      ? rules.map((rule) => (rule.id === editingRule.id ? editingRule : rule))
      : [...rules, editingRule];

    setRules(updatedRules);
    setEditingRule(null);
    setIsEditing(false);
    showNotification("规则已保存", "success");
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingRule(null);
    setIsEditing(false);
  };

  // 处理数据类型选择变更
  const handleDataTypeChange = (dataType: DataType) => {
    if (!editingRule) return;

    const updatedDataTypes = editingRule.dataTypes.includes(dataType)
      ? editingRule.dataTypes.filter((type) => type !== dataType)
      : [...editingRule.dataTypes, dataType];

    setEditingRule({ ...editingRule, dataTypes: updatedDataTypes });
  };

  // 重置所有设置
  const resetSettings = () => {
    if (
      window.confirm(
        "确定要重置所有设置吗？所有自定义规则将被清除，并恢复默认设置。"
      )
    ) {
      setRules([...defaultRules]);
      showNotification("所有设置已重置为默认值", "info");
    }
  };

  // 导出设置为JSON文件
  const exportSettings = () => {
    const dataStr = JSON.stringify(rules, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `cleaner-settings-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    showNotification("设置已导出", "success");
  };

  // 导入设置
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedRules = JSON.parse(content) as CleaningRule[];

        if (
          Array.isArray(importedRules) &&
          importedRules.every(
            (rule) =>
              typeof rule.id === "string" &&
              typeof rule.name === "string" &&
              typeof rule.domain === "string" &&
              Array.isArray(rule.dataTypes)
          )
        ) {
          setRules(importedRules);
          showNotification("设置已成功导入", "success");
        } else {
          throw new Error("无效的设置文件格式");
        }
      } catch (error) {
        showNotification(
          `导入失败: ${error instanceof Error ? error.message : "未知错误"}`,
          "error"
        );
      }
    };
    reader.readAsText(file);

    // 重置文件输入，以便能够重复导入相同文件
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* 通知信息 */}
      {notification && (
        <div
          className={`p-3 rounded-md flex items-center ${
            notification.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : notification.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {notification.type === "success" && (
            <svg
              className="mr-2 w-5 h-5 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {notification.type === "error" && (
            <svg
              className="mr-2 w-5 h-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {notification.type === "info" && (
            <svg
              className="mr-2 w-5 h-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("rules")}
            className={`${
              activeTab === "rules"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm`}
          >
            {t("rules", "规则")}
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`${
              activeTab === "preferences"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm`}
          >
            {t("preferences", "首选项")}
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`${
              activeTab === "about"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm`}
          >
            {t("about", "关于")}
          </button>
        </nav>
      </div>

      {/* 清理规则标签页 */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          {/* 规则编辑表单 */}
          {isEditing && editingRule && (
            <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {editingRule.id.startsWith("rule") &&
                !rules.find((r) => r.id === editingRule.id)
                  ? "添加新规则"
                  : "编辑规则"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    规则名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingRule.name}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, name: e.target.value })
                    }
                    className="px-3 py-2 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：社交媒体网站"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    域名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingRule.domain}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, domain: e.target.value })
                    }
                    className="px-3 py-2 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：*.example.com 或用逗号分隔多个域名"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    可以使用 * 作为通配符，用逗号分隔多个域名
                  </p>
                </div>

                <div>
                  <label className="block mb-3 text-sm font-medium text-gray-700">
                    数据类型
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {availableDataTypes.map(({ value, label, description }) => (
                      <div
                        key={value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          editingRule.dataTypes.includes(value)
                            ? "bg-blue-50 border-blue-200 shadow-sm"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        }`}
                        onClick={() => handleDataTypeChange(value)}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id={`dataType-${value}`}
                            checked={editingRule.dataTypes.includes(value)}
                            onChange={() => handleDataTypeChange(value)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="ml-3">
                            <label
                              htmlFor={`dataType-${value}`}
                              className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                              {label}
                            </label>
                            <p className="mt-1 text-xs text-gray-500">
                              {description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2 space-x-3">
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-2 text-sm text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {t("cancel", "取消")}
                  </button>
                  <button
                    onClick={saveEditingRule}
                    className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {t("save", "保存")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 规则列表和添加规则按钮 */}
          {!isEditing && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {t("cleaningRules", "清理规则")}
                </h3>
                <button
                  onClick={addRule}
                  className="flex items-center px-3 py-2 text-sm text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="mr-1 w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  {t("addRule", "添加规则")}
                </button>
              </div>

              {/* 规则列表 */}
              <div className="space-y-3">
                {rules.length === 0 ? (
                  <div className="flex flex-col justify-center items-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <svg
                      className="mb-2 w-12 h-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {t(
                        "noRulesMessage",
                        "尚未创建任何规则。点击添加规则按钮创建第一条规则。"
                      )}
                    </p>
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-gray-900 text-md">
                          {rule.name}
                        </h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editRule(rule)}
                            className="p-1 text-gray-400 transition-colors hover:text-blue-500"
                            title={t("edit", "编辑")}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1 text-gray-400 transition-colors hover:text-red-500"
                            title={t("delete", "删除")}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="mb-3 text-sm text-gray-600">
                        <span className="font-medium">
                          {t("domain", "域名")}：
                        </span>{" "}
                        {rule.domain}
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          {t("dataType", "数据类型")}： 清理数据类型：
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rule.dataTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {availableDataTypes.find(
                                (dt) => dt.value === type
                              )?.label || type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 偏好设置标签页 */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              导入/导出设置
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              您可以导出当前设置以备份，或导入之前保存的设置。
            </p>

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
              <button
                onClick={exportSettings}
                className="flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="mr-2 w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                导出设置
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="flex justify-center items-center px-4 py-2 w-full text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg
                    className="mr-2 w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  导入设置
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="mb-4 text-lg font-medium text-gray-900">重置设置</h3>
            <p className="mb-4 text-sm text-gray-600">
              清除所有自定义设置，恢复为默认状态。
            </p>

            <button
              onClick={resetSettings}
              className="flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md border border-transparent shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg
                className="mr-2 w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              重置所有设置
            </button>
          </div>
        </div>
      )}

      {/* 关于插件标签页 */}
      {activeTab === "about" && (
        <div className="space-y-6">
          <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center mb-4">
              <svg
                className="mr-4 w-12 h-12 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  ClearPage 浏览器插件
                </h2>
                <p className="text-sm text-gray-600">版本 1.0.9</p>
              </div>
            </div>

            <div className="max-w-none text-gray-600 prose prose-sm">
              <p>这是一个帮助您清理网站缓存数据和监控网页性能的浏览器插件。</p>
              <p>主要功能：</p>
              <ul>
                <li>智能清理网站缓存和存储数据</li>
                <li>分析网页加载性能，提供优化建议</li>
                <li>自定义清理规则，方便一键操作</li>
              </ul>
            </div>

            <div className="pt-4 mt-6 border-t border-gray-200">
              <h3 className="mb-2 text-sm font-medium text-gray-900">
                联系我们
              </h3>
              <a
                href="mailto:support@clearpage.example.com"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                yhrsc30@gmail.com
              </a>
            </div>
          </div>

          <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="mb-4 text-lg font-medium text-gray-900">隐私政策</h3>
            <div className="max-w-none text-gray-600 prose prose-sm">
              <p>本插件非常重视您的隐私：</p>
              <ul>
                <li>所有操作均在本地执行，不会向外部服务器发送您的数据</li>
                <li>您的浏览历史和网站数据不会被收集或分享</li>
                <li>插件需要的权限仅用于执行缓存清理和性能分析功能</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
