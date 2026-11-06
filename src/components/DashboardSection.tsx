'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import {
  fetchTransactionsByPeriod,
  MonthlyBankSummaryRow,
} from '@/services/transactionService';
import { Transaction } from '@/types/transaction';
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
  bankSummaryRows: MonthlyBankSummaryRow[];
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  availableMonths: string[];
  availableYears: number[];
  refreshKey: number;
}

export default function DashboardSection({
  bankSummaryRows,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  availableYears,
  refreshKey,
}: Readonly<DashboardSectionProps>) {
  const [groupBy, setGroupBy] = useState<GroupByOption>('bank');
  const [descTransactions, setDescTransactions] = useState<Transaction[]>([]);

  // Lazy-load รายการธุรกรรมเฉพาะเมื่อผู้ใช้กดสลับกราฟเป็น "แยกตามรายการ (description)"
  useEffect(() => {
    if (groupBy !== 'description') return;

    let active = true;
    fetchTransactionsByPeriod(selectedMonth)
      .then((rows) => {
        if (active) setDescTransactions(rows);
      })
      .catch(() => {
        if (active) setDescTransactions([]);
      });

    return () => {
      active = false;
    };
  }, [groupBy, selectedMonth, refreshKey]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const inc = bankSummaryRows
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    const exp = bankSummaryRows
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: inc - exp,
    };
  }, [bankSummaryRows]);

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
          bankSummaryRows={bankSummaryRows}
          transactions={descTransactions}
          groupBy={groupBy}
        />

        <ProportionDoughnutCard
          title={`สัดส่วนรายรับ (${groupSuffix})`}
          iconColorClass="text-[#2ecc71]"
          emptyMessage="ไม่มีข้อมูลรายรับในเดือนนี้"
          type="income"
          bankSummaryRows={bankSummaryRows}
          transactions={descTransactions}
          groupBy={groupBy}
        />

        <BankBreakdownCard
          bankSummaryRows={bankSummaryRows}
          totalVolume={totalIncome + totalExpense}
        />
      </div>

      <YearlyTrendBarChart
        availableYears={availableYears}
        refreshKey={refreshKey}
      />
    </div>
  );
}
