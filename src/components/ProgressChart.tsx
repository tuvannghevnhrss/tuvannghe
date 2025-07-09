"use client";
import { FC, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO
  done: boolean;
}

interface Props {
  tasks: Task[];
}

const ProgressChart: FC<Props> = ({ tasks }) => {
  const { total, finished } = useMemo(() => {
    const total = tasks.length;
    const finished = tasks.filter((t) => t.done).length;
    return { total, finished };
  }, [tasks]);

  if (total < 2) {
    return (
      <p className="text-sm italic text-gray-500">
        Chưa đủ dữ liệu để vẽ tiến độ.
      </p>
    );
  }

  const data = {
    labels: ["Hoàn thành", "Chưa xong"],
    datasets: [
      {
        label: "Số việc",
        data: [finished, total - finished],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return <Bar data={data} options={options} />;
};

export default ProgressChart;
