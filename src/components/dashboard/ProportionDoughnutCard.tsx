'use client';

import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { CHART_PALETTE, getBankColor, Transaction } from '@/types/transaction';
import { GroupByOption } from './DashboardHeader';

interface ProportionDoughnutCardProps {
  title: string;
  iconColorClass: string;
  emptyMessage: string;
  type: 'income' | 'expense';
  transactions: Transaction[];
  groupBy: GroupByOption;
}

const DOUGHNUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  animation: { duration: 400 },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => {
          const val = Number(ctx.raw || 0);
          return ` ${ctx.label}: ฿${val.toLocaleString('th-TH', {
            minimumFractionDigits: 2,
          })}`;
        },
      },
    },
  },
};

export default function ProportionDoughnutCard({
  title,
  iconColorClass,
  emptyMessage,
  type,
  transactions,
  groupBy,
}: Readonly<ProportionDoughnutCardProps>) {
  const { chartData, legendItems } = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        const key =
          groupBy === 'bank'
            ? (t.bank || 'ไม่ระบุธนาคาร').trim()
            : (t.description || t.bank || 'ไม่ระบุรายละเอียด').trim();
        map[key] = (map[key] || 0) + Number(t.amount || 0);
      });

    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const totalSum = entries.reduce((s, e) => s + e[1], 0);

    const labels = entries.map((e) => e[0]);
    const data = entries.map((e) => e[1]);
    const colors = labels.map((label, idx) =>
      groupBy === 'bank'
        ? getBankColor(label, idx)
        : CHART_PALETTE[idx % CHART_PALETTE.length]
    );

    const items = entries.map(([label, amount], idx) => ({
      label,
      amount,
      color: colors[idx],
      pct: totalSum > 0 ? (amount / totalSum) * 100 : 0,
    }));

    return {
      chartData: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      legendItems: items,
    };
  }, [transactions, type, groupBy]);

  return (
    <div className="app-card mb-0 flex flex-col">
      <div className="app-card-header flex justify-between items-center">
        <span>{title}</span>
        <i className={`fas fa-chart-pie ${iconColorClass}`}></i>
      </div>

      <div className="app-card-body flex-1 flex flex-col">
        {legendItems.length > 0 ? (
          <>
            <div className="relative h-[180px] w-full shrink-0">
              <Doughnut data={chartData} options={DOUGHNUT_OPTIONS} />
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div
                className={`space-y-2 ${
                  legendItems.length > 4
                    ? 'max-h-[136px] overflow-y-auto pr-1.5 custom-scrollbar'
                    : ''
                }`}
              >
                {legendItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-2 text-xs"
                    title={`${item.label} — ฿${item.amount.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                    })} (${item.pct.toFixed(1)}%)`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-3 h-3 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="text-gray-700 truncate">{item.label}</span>
                    </div>
                    <div className="shrink-0 text-right font-medium text-gray-800">
                      ฿
                      {item.amount.toLocaleString('th-TH', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      <span className="text-gray-400 text-[11px]">
                        ({item.pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="h-[260px] flex flex-col items-center justify-center text-gray-400 text-sm">
            <i className="fas fa-inbox text-3xl mb-2 opacity-50"></i>
            <span>{emptyMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
