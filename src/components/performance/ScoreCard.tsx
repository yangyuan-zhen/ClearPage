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

const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  title,
  getRating,
  t,
}) => {
  const [displayScore, setDisplayScore] = useState(0);

  // 平滑动画效果
  useEffect(() => {
    if (score <= 0) {
      setDisplayScore(0);
      return;
    }

    const duration = 1000; // 动画持续时间（毫秒）
    const frames = 60; // 总帧数
    const step = score / frames; // 每帧增加的分数
    let currentFrame = 0;

    const timer = setInterval(() => {
      currentFrame++;
      const newScore = Math.min(Math.round(step * currentFrame), score);
      setDisplayScore(newScore);

      if (currentFrame >= frames) {
        clearInterval(timer);
      }
    }, duration / frames);

    return () => clearInterval(timer);
  }, [score]);

  const rating = getRating(score);

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700">{title}</h3>
        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {displayScore}
          <span className="text-lg">/100</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
        <motion.div
          className={`h-2.5 rounded-full ${
            score >= 90
              ? "bg-green-500"
              : score >= 70
              ? "bg-green-600"
              : score >= 50
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div
        className={`text-sm px-2 py-1 rounded inline-block ${getScoreBgColor(
          score
        )} ${getScoreColor(score)}`}
      >
        {t(rating, rating)}
      </div>
    </motion.div>
  );
};

export default ScoreCard;
