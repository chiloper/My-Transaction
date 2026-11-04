'use client';

import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Transaction, CHART_PALETTE, getBankColor } from '@/types/transaction';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface DashboardSectionProps {
  transactions: Transaction[];
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  availableMonths: string[];
}

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function formatMonthThai(ym: string): string {
  if (ym === 'ALL') return 'ทั้งหมดทุกเดือน';
  const [y, m] = ym.split('-');
  const yearNum = parseInt(y, 10);
  const monthIdx = parseInt(m, 10) - 1;
  if (isNaN(yearNum) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return ym;
  const date = new Date(yearNum, monthIdx, 1);
  const monthLong = date.toLocaleDateString('th-TH', { month: 'long' });
  return `${monthLong} ${yearNum + 543}`;
}

export function getTxDateKey(tx: Transaction): string {
  const raw = tx.transaction_date || tx.created_at;
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw.slice(0, 10);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return String(raw).slice(0, 10);
  }
}

export default function DashboardSection({
  transactions,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
}: DashboardSectionProps) {
  const [groupBy, setGroupBy] = useState<'bank' | 'description'>('bank');

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach((tx) => {
      const dateStr = getTxDateKey(tx);
      if (dateStr.length >= 4) {
        const y = parseInt(dateStr.slice(0, 4), 10);
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Filtered transactions for selected month
  const monthlyTxs = useMemo(() => {
    if (selectedMonth === 'ALL') return transactions;
    return transactions.filter((t) => getTxDateKey(t).startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const inc = monthlyTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const exp = monthlyTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: inc - exp,
    };
  }, [monthlyTxs]);

  // Grouping helper for Doughnut Charts
  const buildChartData = (type: 'income' | 'expense') => {
    const map: Record<string, number> = {};
    monthlyTxs
      .filter((t) => t.type === type)
      .forEach((t) => {
        const key =
          groupBy === 'bank'
            ? (t.bank || 'ไม่ระบุธนาคาร').trim()
            : (t.description || t.bank || 'ไม่ระบุรายละเอียด').trim();
        map[key] = (map[key] || 0) + Number(t.amount || 0);
      });

    // Sort by amount descending, group tail if > 8 items
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const topEntries = entries.slice(0, 8);
    if (entries.length > 8) {
      const otherSum = entries.slice(8).reduce((s, item) => s + item[1], 0);
      topEntries.push(['อื่นๆ', otherSum]);
    }

    const labels = topEntries.map((e) => e[0]);
    const data = topEntries.map((e) => e[1]);
    const colors = labels.map((label, idx) =>
      groupBy === 'bank'
        ? getBankColor(label, idx)
        : CHART_PALETTE[idx % CHART_PALETTE.length]
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 10,
        },
      ],
    };
  };

  const incomeChartData = useMemo(
    () => buildChartData('income'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthlyTxs, groupBy]
  );

  const expenseChartData = useMemo(
    () => buildChartData('expense'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthlyTxs, groupBy]
  );

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    animation: { duration: 400 },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { family: 'Prompt', size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => {
            const val = Number(ctx.raw || 0);
            return ` ${ctx.label}: ฿${val.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
  };

  // Bank Breakdown Summary for the 3rd card
  const bankSummary = useMemo(() => {
    const map: Record<
      string,
      { bank: string; income: number; expense: number; count: number }
    > = {};
    monthlyTxs.forEach((t) => {
      const b = (t.bank || 'ไม่ระบุธนาคาร').trim();
      if (!map[b]) {
        map[b] = { bank: b, income: 0, expense: 0, count: 0 };
      }
      if (t.type === 'income') map[b].income += Number(t.amount || 0);
      else map[b].expense += Number(t.amount || 0);
      map[b].count += 1;
    });
    return Object.values(map).sort(
      (a, b) => b.expense + b.income - (a.expense + a.income)
    );
  }, [monthlyTxs]);

  // Yearly Bar Chart Data
  const yearChartData = useMemo(() => {
    const incData: number[] = [];
    const expData: number[] = [];

    for (let i = 0; i < 12; i++) {
      const mPrefix = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
      const mTxs = transactions.filter((t) => getTxDateKey(t).startsWith(mPrefix));
      const inc = mTxs
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = mTxs
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      incData.push(inc);
      expData.push(exp);
    }

    return {
      labels: THAI_MONTHS_SHORT,
      datasets: [
        {
          label: 'รายรับ',
          data: incData,
          backgroundColor: '#2ecc71',
          borderRadius: 6,
        },
        {
          label: 'รายจ่าย',
          data: expData,
          backgroundColor: '#f72585',
          borderRadius: 6,
        },
      ],
    };
  }, [transactions, selectedYear]);

  const barOptions = {
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
            return ` ${ctx.dataset.label}: ฿${val.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
  };

  return (
    <div>
      {/* Header + Month Selector */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h4 className="text-xl font-bold text-gray-800 mb-1">ภาพรวมการเงิน</h4>
          <p className="text-sm text-gray-500 m-0">
            สรุปข้อมูลประจำเดือน{' '}
            <span className="font-semibold text-[#4361ee]">
              {formatMonthThai(selectedMonth)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex rounded-lg bg-white p-1 shadow-xs border border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setGroupBy('bank')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                groupBy === 'bank'
                  ? 'bg-[#4361ee] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-university mr-1.5"></i>แยกตามธนาคาร
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('description')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                groupBy === 'description'
                  ? 'bg-[#4361ee] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-list-ul mr-1.5"></i>แยกตามรายการ
            </button>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-medium text-gray-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#4361ee] flex-1 sm:flex-none sm:w-52"
          >
            <option value="ALL">ดูทั้งหมดทุกเดือน</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthThai(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card bg-gradient-success">
          <i className="fas fa-arrow-up icon-bg"></i>
          <p>รายรับรวม</p>
          <h3>
            ฿{totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="stat-card bg-gradient-danger">
          <i className="fas fa-arrow-down icon-bg"></i>
          <p>รายจ่ายรวม</p>
          <h3>
            ฿{totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="stat-card bg-gradient-primary">
          <i className="fas fa-wallet icon-bg"></i>
          <p>คงเหลือสุทธิ</p>
          <h3>
            {balance < 0 ? '-' : ''}฿
            {Math.abs(balance).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      {/* 3 Middle Cards: Income Pie, Expense Pie, Bank Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Income Chart */}
        <div className="app-card mb-0 flex flex-col">
          <div className="app-card-header flex justify-between items-center">
            <span>
              สัดส่วนรายรับ ({groupBy === 'bank' ? 'ธนาคาร' : 'รายละเอียด'})
            </span>
            <i className="fas fa-chart-pie text-[#2ecc71]"></i>
          </div>
          <div className="app-card-body flex-1 flex items-center justify-center">
            <div className="relative h-[280px] w-full">
              {incomeChartData.labels.length > 0 ? (
                <Doughnut data={incomeChartData} options={doughnutOptions} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                  <i className="fas fa-inbox text-3xl mb-2 opacity-50"></i>
                  <span>ไม่มีข้อมูลรายรับในเดือนนี้</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expense Chart */}
        <div className="app-card mb-0 flex flex-col">
          <div className="app-card-header flex justify-between items-center">
            <span>
              สัดส่วนรายจ่าย ({groupBy === 'bank' ? 'ธนาคาร' : 'รายละเอียด'})
            </span>
            <i className="fas fa-chart-pie text-[#e63946]"></i>
          </div>
          <div className="app-card-body flex-1 flex items-center justify-center">
            <div className="relative h-[280px] w-full">
              {expenseChartData.labels.length > 0 ? (
                <Doughnut data={expenseChartData} options={doughnutOptions} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                  <i className="fas fa-inbox text-3xl mb-2 opacity-50"></i>
                  <span>ไม่มีข้อมูลรายจ่ายในเดือนนี้</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank Breakdown Card */}
        <div className="app-card mb-0 flex flex-col">
          <div className="app-card-header flex justify-between items-center">
            <span>สรุปแยกตามธนาคาร</span>
            <i className="fas fa-university text-[#4361ee]"></i>
          </div>
          <div className="app-card-body overflow-y-auto max-h-[320px] space-y-4">
            {bankSummary.length === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-gray-400 text-sm">
                <i className="fas fa-search text-2xl mb-2 opacity-50"></i>
                <span>ยังไม่มีรายการธุรกรรมในเดือนนี้</span>
              </div>
            ) : (
              bankSummary.map((item, idx) => {
                const maxTotal = Math.max(totalIncome + totalExpense, 1);
                const bankTotal = item.income + item.expense;
                const pct = Math.min((bankTotal / maxTotal) * 100, 100);
                const bankColor = getBankColor(item.bank, idx);

                return (
                  <div key={item.bank} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: bankColor }}
                        ></span>
                        {item.bank}
                        <span className="text-gray-400 font-normal">
                          ({item.count} รายการ)
                        </span>
                      </span>
                      <span className="font-medium text-gray-600">
                        {item.income > 0 && (
                          <span className="text-emerald-600 mr-2">
                            +฿{item.income.toLocaleString()}
                          </span>
                        )}
                        {item.expense > 0 && (
                          <span className="text-rose-600">
                            -฿{item.expense.toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: bankColor,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Yearly Summary Bar Chart */}
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
            <Bar data={yearChartData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
