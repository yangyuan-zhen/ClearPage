import React, { useState, useEffect } from "react";
import { DataType } from "../types";
import { getMessage } from "../utils/i18n";

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
  const [rules, setRules] = useState<CleaningRule[]>([]);
  const [editingRule, setEditingRule] = useState<CleaningRule | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 所有支持的数据类型及其显示名称
  const availableDataTypes: { value: DataType; label: string }[] = [
    { value: "cache", label: "缓存" },
    { value: "cookies", label: "Cookie" },
    { value: "localStorage", label: "本地存储" },
    { value: "sessionStorage", label: "会话存储" },
    { value: "indexedDB", label: "IndexedDB数据库" },
    { value: "webSQL", label: "WebSQL数据库" },
    { value: "fileSystem", label: "文件系统存储" },
    { value: "formData", label: "表单数据" },
    { value: "serviceWorkers", label: "服务工作线程" },
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
  };

  // 保存编辑中的规则
  const saveEditingRule = () => {
    if (!editingRule) return;

    // 验证必填字段
    if (!editingRule.name || !editingRule.domain) {
      alert("规则名称和域名不能为空");
      return;
    }

    const updatedRules = isEditing
      ? rules.map((rule) => (rule.id === editingRule.id ? editingRule : rule))
      : [...rules, editingRule];

    setRules(updatedRules);
    setEditingRule(null);
    setIsEditing(false);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">自定义清理规则</h2>
        <button
          onClick={addRule}
          className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          添加规则
        </button>
      </div>

      {/* 规则编辑表单 */}
      {isEditing && editingRule && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="mb-3 text-md font-medium">
            {editingRule.id.startsWith("rule") &&
            !rules.find((r) => r.id === editingRule.id)
              ? "添加新规则"
              : "编辑规则"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                规则名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingRule.name}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：社交媒体网站"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                域名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingRule.domain}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, domain: e.target.value })
                }
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：*.example.com 或用逗号分隔多个域名"
              />
              <p className="mt-1 text-xs text-gray-500">
                可以使用 * 作为通配符，用逗号分隔多个域名
              </p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">数据类型</label>
              <div className="grid grid-cols-2 gap-2">
                {availableDataTypes.map(({ value, label }) => (
                  <div key={value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`dataType-${value}`}
                      checked={editingRule.dataTypes.includes(value)}
                      onChange={() => handleDataTypeChange(value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`dataType-${value}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={cancelEditing}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                onClick={saveEditingRule}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 规则列表 */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <p className="text-sm text-gray-500">
            暂无自定义规则，点击"添加规则"创建。
          </p>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="p-3 bg-white border rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <h3 className="ml-2 text-md font-medium">{rule.name}</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editRule(rule)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>域名：{rule.domain}</p>
                <p>
                  数据类型：
                  {rule.dataTypes
                    .map((type) => {
                      const dataTypeInfo = availableDataTypes.find(
                        (dt) => dt.value === type
                      );
                      return dataTypeInfo ? dataTypeInfo.label : type;
                    })
                    .join(", ")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
