import React from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { bytesToSize } from "../../utils/formatUtils";
import { motion } from "framer-motion";

// 注册Chart.js组件
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ResourceChartProps {
  resourceTypes: {
    js: number;
    css: number;
    image: number;
    font: number;
    other: number;
  };
  jsSize: number;
  cssSize: number;
  imageSize: number;
  t: (key: string, fallback: string) => string;
}

const ResourceChart: React.FC<ResourceChartProps> = ({
  resourceTypes,
  jsSize,
  cssSize,
  imageSize,
  t,
}) => {
  // 准备环形图数据
  const doughnutData = {
    labels: [
      t("javascript", "JavaScript"),
      t("css", "CSS"),
      t("images", "图片"),
      t("fonts", "字体"),
      t("other", "其他"),
    ],
    datasets: [
      {
        data: [
          resourceTypes.js,
          resourceTypes.css,
          resourceTypes.image,
          resourceTypes.font,
          resourceTypes.other,
        ],
        backgroundColor: [
          "rgba(54, 162, 235, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(201, 203, 207, 0.7)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(201, 203, 207, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // 准备条形图数据
  const barData = {
    labels: [
      t("javascript", "JavaScript"),
      t("css", "CSS"),
      t("images", "图片"),
    ],
    datasets: [
      {
        label: t("size_in_kb", "大小 (KB)"),
        data: [jsSize / 1024, cssSize / 1024, imageSize / 1024],
        backgroundColor: [
          "rgba(54, 162, 235, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="font-medium text-gray-700 mb-4">
        {t("resource_distribution", "资源分布")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm text-gray-600 mb-2 text-center">
            {t("resource_type_distribution", "资源类型分布")}
          </h4>
          <Doughnut data={doughnutData} />
        </div>

        <div>
          <h4 className="text-sm text-gray-600 mb-2 text-center">
            {t("resource_size_comparison", "资源大小对比")}
          </h4>
          <Bar
            data={barData}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const value = context.raw as number;
                      return bytesToSize(value * 1024);
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceChart;
