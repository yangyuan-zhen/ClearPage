import React from "react";
import { motion } from "framer-motion";

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  status: "good" | "medium" | "poor";
  icon?: string;
  description?: string;
}

/**
 * 格式化显示值，处理异常值
 * @param value 原始值
 * @returns 格式化后的值
 */
const formatDisplayValue = (value: number | string): string => {
  // 如果是字符串并且不是数字格式，直接返回
  if (typeof value === "string" && isNaN(Number(value))) {
    return value;
  }

  // 转换为数字处理
  const numValue = typeof value === "string" ? Number(value) : value;

  // 检查无效值
  if (isNaN(numValue) || !isFinite(numValue)) {
    return "0";
  }

  // 处理负数
  if (numValue < 0) {
    return "0";
  }

  // 处理过大的值（超过一百万显示为1M+）
  if (numValue > 1000000) {
    return "1M+";
  }

  // 返回原始值的字符串表示
  return typeof value === "string" ? value : String(numValue);
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  status,
  icon,
  description,
}) => {
  // 格式化显示值
  const displayValue = formatDisplayValue(value);

  // 根据状态获取颜色
  const getStatusColors = (status: "good" | "medium" | "poor") => {
    switch (status) {
      case "good":
        return {
          bg: "bg-green-50",
          border: "border-green-100",
          text: "text-green-700",
          icon: "text-green-500",
        };
      case "medium":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-100",
          text: "text-yellow-700",
          icon: "text-yellow-500",
        };
      case "poor":
        return {
          bg: "bg-red-50",
          border: "border-red-100",
          text: "text-red-700",
          icon: "text-red-500",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-100",
          text: "text-blue-700",
          icon: "text-blue-500",
        };
    }
  };

  const colors = getStatusColors(status);

  return (
    <motion.div
      className={`${colors.bg} ${colors.border} border rounded-lg p-3 hover:shadow-md transition-shadow duration-200`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <div className="flex items-start">
        {icon && <div className={`${colors.icon} text-xl mr-2`}>{icon}</div>}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
          <div className="flex items-baseline">
            <span className={`text-lg font-bold ${colors.text}`}>
              {displayValue}
            </span>
            {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
