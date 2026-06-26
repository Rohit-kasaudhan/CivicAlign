import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyTrend = ({ data }) => {
  const chartData = data || {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Reported',
        data: [15, 23, 18, 30, 25, 40],
        borderColor: '#1e40af', // civic-blue
        backgroundColor: 'rgba(30, 64, 175, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Resolved',
        data: [10, 15, 14, 20, 22, 35],
        borderColor: '#15803d', // civic-green
        backgroundColor: 'rgba(21, 128, 61, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MonthlyTrend;
