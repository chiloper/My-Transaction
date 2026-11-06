'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  fetchYearlyMonthlyTotals,
  MonthlyTotalPoint,
} from '@/services/transactionService';
import { THAI_MONTHS_SHORT } from '@/utils/dateUtils';

interface YearlyTrendBarChartProps {
  availableYears: number[];
  refreshKey: number;
}

const BAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f0f0f0' },
      ticks: {
        font: { family: 'Prompt', size: 11 },
        callback: (val: string | number) => `฿${Number(val).toLocaleString()}`,
      },
    },
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Prompt', size: 12 } },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: { font: { family: 'Prompt', size: 12 } },
    },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => {
          const val = Number(ctx.raw || 0);
          return ` ${ctx.dataset.label}: ฿${val.toLocaleString('th-TH', {
            minimumFractionDigits: 2,
          })}`;
        },
      },
    },
  },
};

export default function YearlyTrendBarChart({
  availableYears,
  refreshKey,
}: Readonly<YearlyTrendBarChartProps>) {
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear()
  );
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotalPoint>({
    income: new Array(12).fill(0),
    expense: new Array(12).fill(0),
  });

  useEffect(() => {
    let active = true;
    fetchYearlyMonthlyTotals(selectedYear)
      .then((res) => {
        if (active) setMonthlyTotals(res);
      })
      .catch(() => {
        if (active) {
          setMonthlyTotals({
            income: new Array(12).fill(0),
            expense: new Array(12).fill(0),
          });
        }
      });
    return () => {
      active = false;
    };
  }, [selectedYear, refreshKey]);

  const yearChartData = useMemo(
    () => ({
      labels: THAI_MONTHS_SHORT,
      datasets: [
        {
          label: 'รายรับ',
          data: monthlyTotals.income,
          backgroundColor: '#2ecc71',
          borderRadius: 6,
        },
        {
          label: 'รายจ่าย',
          data: monthlyTotals.expense,
          backgroundColor: '#f72585',
          borderRadius: 6,
        },
      ],
    }),
    [monthlyTotals]
  );

  return (
    <div className="app-card">
      <div className="app-card-header flex flex-wrap justify-between items-center gap-2">
        <span>แนวโน้มรายรับ-รายจ่าย ตลอดปี (พ.ศ. {selectedYear + 543})</span>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              ปี พ.ศ. {y + 543} ({y})
            </option>
          ))}
        </select>
      </div>
      <div className="app-card-body">
        <div className="h-[320px] sm:h-[350px] w-full">
          <Bar data={yearChartData} options={BAR_OPTIONS} />
        </div>
      </div>
    </div>
  );
}
