import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ScoreCardProps {
  score: number;
  title: string;
  getRating: (score: number) => string;
  t: (key: string, fallback: string) => string;
}

/**
 * 获取分数对应的颜色
 * @param score 性能评分
 * @returns 对应的颜色类名
 */
const getScoreColor = (score: number): string => {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
};

/**
 * 获取背景颜色
 * @param score 性能评分
 * @returns 对应的背景颜色类名
 */
const getScoreBgColor = (score: number): string => {
  if (score >= 90) return "bg-green-50";
  if (score >= 70) return "bg-green-100";
  if (score >= 50) return "bg-yellow-100";
  return "bg-red-100";
};

/**
 * 规范化分数，确保在0-100范围内
 * @param rawScore 原始分数
 * @returns 规范化后的分数
 */
const normalizeScore = (rawScore: number): number => {
  // 检查是否为有效数字
  if (isNaN(rawScore) || !isFinite(rawScore)) {
    return 0;
  }
  // 限制在0-100范围内
  return Math.max(0, Math.min(100, rawScore));
};

const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  title,
  getRating,
  t,
}) => {
  // 规范化输入分数
  const normalizedScore = normalizeScore(score);
  const [displayScore, setDisplayScore] = useState(0);

  // 平滑动画效果
  useEffect(() => {
    if (normalizedScore <= 0) {
      setDisplayScore(0);
      return;
    }

    const duration = 1000; // 动画持续时间（毫秒）
    const frames = 60; // 总帧数
    const step = normalizedScore / frames; // 每帧增加的分数
    let currentFrame = 0;

    const timer = setInterval(() => {
      currentFrame++;
      const newScore = Math.min(
        Math.round(step * currentFrame),
        normalizedScore
      );
      setDisplayScore(newScore);

      if (currentFrame >= frames) {
        clearInterval(timer);
      }
    }, duration / frames);

    return () => clearInterval(timer);
  }, [normalizedScore]);

  const rating = getRating(normalizedScore);

  return (
    <motion.div
      className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md border-2 border-gray-200 p-4 hover:shadow-xl transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <span className="mr-2">🎯</span>
          {title}
        </h3>
        <div className={`text-3xl font-bold ${getScoreColor(normalizedScore)}`}>
          {displayScore}
          <span className="text-lg text-gray-500">/100</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
        <motion.div
          className={`h-2.5 rounded-full ${
            normalizedScore >= 90
              ? "bg-green-500"
              : normalizedScore >= 70
              ? "bg-green-600"
              : normalizedScore >= 50
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${normalizedScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div
        className={`text-sm px-3 py-1.5 rounded-full inline-block font-medium ${getScoreBgColor(
          normalizedScore
        )} ${getScoreColor(normalizedScore)}`}
      >
        {t(rating, rating)}
      </div>
    </motion.div>
  );
};

export default ScoreCard;
