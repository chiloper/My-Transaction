'use client';

import React, { useMemo, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Transaction } from '@/types/transaction';
import { getTxDateKey } from '@/utils/dateUtils';
import DashboardHeader, { GroupByOption } from './dashboard/DashboardHeader';
import SummaryStatCards from './dashboard/SummaryStatCards';
import ProportionDoughnutCard from './dashboard/ProportionDoughnutCard';
import BankBreakdownCard from './dashboard/BankBreakdownCard';
import YearlyTrendBarChart from './dashboard/YearlyTrendBarChart';

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

export default function DashboardSection({
  transactions,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
}: Readonly<DashboardSectionProps>) {
  const [groupBy, setGroupBy] = useState<GroupByOption>('bank');

  const monthlyTxs = useMemo(() => {
    if (selectedMonth === 'ALL') return transactions;
    return transactions.filter((t) =>
      getTxDateKey(t).startsWith(selectedMonth)
    );
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

  const groupSuffix = groupBy === 'bank' ? 'ธนาคาร' : 'รายละเอียด';

  return (
    <div>
      <DashboardHeader
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        availableMonths={availableMonths}
        groupBy={groupBy}
        onChangeGroupBy={setGroupBy}
      />

      <SummaryStatCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        <ProportionDoughnutCard
          title={`สัดส่วนรายจ่าย (${groupSuffix})`}
          iconColorClass="text-[#e63946]"
          emptyMessage="ไม่มีข้อมูลรายจ่ายในเดือนนี้"
          type="expense"
          transactions={monthlyTxs}
          groupBy={groupBy}
        />

        <ProportionDoughnutCard
          title={`สัดส่วนรายรับ (${groupSuffix})`}
          iconColorClass="text-[#2ecc71]"
          emptyMessage="ไม่มีข้อมูลรายรับในเดือนนี้"
          type="income"
          transactions={monthlyTxs}
          groupBy={groupBy}
        />

        <BankBreakdownCard
          transactions={monthlyTxs}
          totalVolume={totalIncome + totalExpense}
        />
      </div>

      <YearlyTrendBarChart transactions={transactions} />
    </div>
  );
}
