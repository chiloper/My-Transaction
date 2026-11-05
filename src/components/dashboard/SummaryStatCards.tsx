'use client';

import React from 'react';

interface SummaryStatCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

function formatCurrency(val: number): string {
  return val.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SummaryStatCards({
  totalIncome,
  totalExpense,
  balance,
}: Readonly<SummaryStatCardsProps>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

      <div className="stat-card bg-gradient-danger">
        <i className="fas fa-arrow-down icon-bg"></i>
        <p>รายจ่ายรวม</p>
        <h3>฿{formatCurrency(totalExpense)}</h3>
      </div>

      <div className="stat-card bg-gradient-success">
        <i className="fas fa-arrow-up icon-bg"></i>
        <p>รายรับรวม</p>
        <h3>฿{formatCurrency(totalIncome)}</h3>
      </div>
      
      <div className="stat-card bg-gradient-primary">
        <i className="fas fa-wallet icon-bg"></i>
        <p>คงเหลือสุทธิ</p>
        <h3>
          {balance < 0 ? '-' : ''}฿{formatCurrency(Math.abs(balance))}
        </h3>
      </div>
    </div>
  );
}
