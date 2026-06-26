import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const CategoryDonut = ({ data }) => {
  const chartData = data || {
    labels: ['Roads/Potholes', 'Sanitation/Garbage', 'Water Supply', 'Streetlights', 'Other'],
    datasets: [
      {
        label: 'Issues Count',
        data: [12, 19, 3, 5, 2],
        backgroundColor: [
          '#1e40af', // civic-blue
          '#15803d', // civic-green
          '#b45309', // civic-amber
          '#b91c1c', // civic-red
          '#6b7280', // gray
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default CategoryDonut;
