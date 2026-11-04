'use client';

import React, { useMemo, useState } from 'react';
import {
  Transaction,
  NewTransactionInput,
  BANK_CONFIG,
  getBankColor,
} from '@/types/transaction';
import { getTxDateKey } from './DashboardSection';

interface TransactionsSectionProps {
  transactions: Transaction[];
  onAddTransactions: (items: NewTransactionInput[]) => Promise<void>;
  onDeleteTransaction: (id: number) => Promise<void>;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
}

interface DraftCard extends NewTransactionInput {
  tempId: number;
}

function getDefaultDateTimeLocal(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function TransactionsSection({
  transactions,
  onAddTransactions,
  onDeleteTransaction,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
}: TransactionsSectionProps) {
  const [drafts, setDrafts] = useState<DraftCard[]>(() => [
    {
      tempId: 1,
      transaction_date: getDefaultDateTimeLocal(),
      type: 'expense',
      bank: 'KBank',
      amount: 0,
      description: '',
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [showFilter, setShowFilter] = useState(true);
  const [filterBank, setFilterBank] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRawTx, setSelectedRawTx] = useState<Transaction | null>(null);

  const bankOptions = useMemo(() => {
    const set = new Set<string>(Object.keys(BANK_CONFIG));
    transactions.forEach((t) => {
      if (t.bank) set.add(t.bank.trim());
    });
    return Array.from(set);
  }, [transactions]);

  const addDraftCard = () => {
    setDrafts((prev) => [
      ...prev,
      {
        tempId: Date.now() + Math.random(),
        transaction_date: getDefaultDateTimeLocal(),
        type: 'expense',
        bank: 'KBank',
        amount: 0,
        description: '',
      },
    ]);
  };

  const removeDraftCard = (tempId: number) => {
    if (drafts.length <= 1) return;
    setDrafts((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  const updateDraft = (
    tempId: number,
    field: keyof NewTransactionInput,
    value: string | number
  ) => {
    setDrafts((prev) =>
      prev.map((d) => (d.tempId === tempId ? { ...d, [field]: value } : d))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = drafts.filter((d) => Number(d.amount) > 0);
    if (valid.length === 0) return;

    setSubmitting(true);
    try {
      await onAddTransactions(
        valid.map(({ tempId: _, ...rest }) => rest)
      );
      setDrafts([
        {
          tempId: Date.now(),
          transaction_date: getDefaultDateTimeLocal(),
          type: 'expense',
          bank: 'KBank',
          amount: 0,
          description: '',
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const dateStr = getTxDateKey(t);
      if (filterBank && (t.bank || '') !== filterBank) return false;
      if (filterType && t.type !== filterType) return false;
      if (filterStartDate && dateStr < filterStartDate) return false;
      if (filterEndDate && dateStr > filterEndDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const b = (t.bank || '').toLowerCase();
        const raw = (t.raw_body || '').toLowerCase();
        if (!desc.includes(q) && !b.includes(q) && !raw.includes(q)) return false;
      }
      return true;
    });
  }, [
    transactions,
    filterBank,
    filterType,
    filterStartDate,
    filterEndDate,
    searchQuery,
  ]);

  const resetFilters = () => {
    setFilterBank('');
    setFilterType('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSearchQuery('');
  };

  return (
    <div>
      {/* Add New Transaction Card */}
      <div className="app-card border-2 border-[#4361ee] overflow-hidden mb-6">
        <div className="bg-[#4361ee] text-white px-6 py-4 font-semibold flex items-center">
          <i className="fas fa-plus-circle mr-2"></i>บันทึกรายการใหม่
        </div>
        <div className="app-card-body">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {drafts.map((card, index) => (
                <div
                  key={card.tempId}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 shadow-2xs"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold bg-gray-600 text-white px-2.5 py-1 rounded-md">
                      รายการใหม่ #{index + 1}
                    </span>
                    {drafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDraftCard(card.tempId)}
                        className="text-gray-400 hover:text-rose-500 text-sm cursor-pointer"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        วันที่และเวลา
                      </label>
                      <input
                        type="datetime-local"
                        value={card.transaction_date}
                        onChange={(e) =>
                          updateDraft(card.tempId, 'transaction_date', e.target.value)
                        }
                        required
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        ประเภท
                      </label>
                      <select
                        value={card.type}
                        onChange={(e) =>
                          updateDraft(
                            card.tempId,
                            'type',
                            e.target.value as 'income' | 'expense'
                          )
                        }
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
                      >
                        <option value="expense">รายจ่าย (Expense)</option>
                        <option value="income">รายรับ (Income)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        ธนาคาร / ช่องทาง (bank)
                      </label>
                      <input
                        list={`bank-list-${card.tempId}`}
                        type="text"
                        value={card.bank}
                        onChange={(e) =>
                          updateDraft(card.tempId, 'bank', e.target.value)
                        }
                        placeholder="เช่น KBank, SCB, BBL..."
                        required
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
                      />
                      <datalist id={`bank-list-${card.tempId}`}>
                        {bankOptions.map((b) => (
                          <option key={b} value={b}>
                            {BANK_CONFIG[b]?.label || b}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        จำนวนเงิน (บาท)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={card.amount || ''}
                        onChange={(e) =>
                          updateDraft(
                            card.tempId,
                            'amount',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        required
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4">
                      <input
                        type="text"
                        placeholder="รายละเอียดเพิ่มเติม (description เช่น ค่าอาหาร, เงินเดือน, โอนเงิน...)"
                        value={card.description}
                        onChange={(e) =>
                          updateDraft(card.tempId, 'description', e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
              <button
                type="button"
                onClick={addDraftCard}
                className="px-4 py-2 rounded-full border border-gray-400 text-gray-600 hover:bg-gray-100 text-sm font-medium transition cursor-pointer"
              >
                <i className="fas fa-plus mr-1.5"></i>เพิ่มช่องกรอก
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-full bg-[#4361ee] hover:bg-[#3f37c9] text-white text-sm font-medium shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <i className="fas fa-save mr-2"></i>
                {submitting ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Transaction History Card */}
      <div className="app-card">
        <div className="app-card-header flex flex-wrap justify-between items-center gap-2">
          <span>
            <i className="fas fa-history mr-2 text-[#4361ee]"></i>
            ประวัติรายการล่าสุด ({filteredTransactions.length} รายการ)
          </span>
          <button
            type="button"
            onClick={() => setShowFilter((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-medium cursor-pointer"
          >
            <i className="fas fa-filter mr-1.5"></i>ตัวกรอง
          </button>
        </div>

        <div className="app-card-body">
          {/* Filter Bar */}
          {showFilter && (
            <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    ธนาคาร (bank)
                  </label>
                  <select
                    value={filterBank}
                    onChange={(e) => setFilterBank(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
                  >
                    <option value="">-- ทั้งหมด --</option>
                    {bankOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    ประเภท (type)
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
                  >
                    <option value="">-- ทั้งหมด --</option>
                    <option value="income">รายรับ (income)</option>
                    <option value="expense">รายจ่าย (expense)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">เริ่มวันที่</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">ถึงวันที่</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    ค้นหารายละเอียด
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหา..."
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={resetFilters}
                      title="รีเซ็ตตัวกรอง"
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium shrink-0 cursor-pointer"
                    >
                      รีเซ็ต
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                  <th className="py-3 px-4 font-semibold">วันที่ / เวลา</th>
                  <th className="py-3 px-4 font-semibold">ธนาคาร</th>
                  <th className="py-3 px-4 font-semibold">ประเภท</th>
                  <th className="py-3 px-4 font-semibold">รายละเอียด</th>
                  <th className="py-3 px-4 font-semibold text-right">จำนวนเงิน</th>
                  <th className="py-3 px-4 font-semibold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      ไม่พบรายการธุรกรรมตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isInc = tx.type === 'income';
                    const rawDate = tx.transaction_date || tx.created_at;
                    const dObj = rawDate ? new Date(rawDate) : null;
                    const bankColor = getBankColor(tx.bank);

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                          {dObj && !isNaN(dObj.getTime()) ? (
                            <div>
                              <div className="font-medium text-gray-800">
                                {dObj.toLocaleDateString('th-TH')}
                              </div>
                              <div className="text-xs text-gray-400">
                                {dObj.toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                น.
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: bankColor }}
                          >
                            {tx.bank || 'ไม่ระบุ'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                              isInc
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isInc ? 'รายรับ' : 'รายจ่าย'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-xs truncate">
                          <div className="font-medium truncate">
                            {tx.description || '-'}
                          </div>
                          {tx.email_id && (
                            <div className="text-[11px] text-gray-400 truncate">
                              <i className="fas fa-envelope mr-1"></i>
                              {tx.email_id}
                            </div>
                          )}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                            isInc ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isInc ? '+' : '-'}฿
                          {Number(tx.amount || 0).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {tx.raw_body && (
                              <button
                                type="button"
                                onClick={() => setSelectedRawTx(tx)}
                                title="ดูข้อความต้นฉบับ (raw_body)"
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-[#4361ee] flex items-center justify-center transition cursor-pointer"
                              >
                                <i className="fas fa-file-alt text-xs"></i>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteTransaction(tx.id)}
                              title="ลบรายการ"
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-rose-50 text-rose-500 flex items-center justify-center transition cursor-pointer"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                ไม่พบรายการธุรกรรมตามเงื่อนไขที่เลือก
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isInc = tx.type === 'income';
                const rawDate = tx.transaction_date || tx.created_at;
                const dObj = rawDate ? new Date(rawDate) : null;
                const bankColor = getBankColor(tx.bank);

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: bankColor }}
                      >
                        {(tx.bank || 'TX').slice(0, 3).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">
                          {tx.description || 'ไม่ระบุรายละเอียด'}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                          <span className="font-medium text-gray-700">
                            {tx.bank || 'ไม่ระบุ'}
                          </span>
                          {dObj && !isNaN(dObj.getTime()) && (
                            <span>
                              • {dObj.toLocaleDateString('th-TH')}{' '}
                              {dObj.toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span
                        className={`font-bold text-sm ${
                          isInc ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isInc ? '+' : '-'}฿
                        {Number(tx.amount || 0).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <div className="flex items-center gap-1">
                        {tx.raw_body && (
                          <button
                            type="button"
                            onClick={() => setSelectedRawTx(tx)}
                            className="p-1.5 text-xs text-gray-500 hover:text-[#4361ee]"
                          >
                            <i className="fas fa-file-alt"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 text-xs text-rose-500"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Raw Body / Email Detail Modal */}
      {selectedRawTx && (
        <div
          className="fixed inset-0 z-[1100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedRawTx(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-800 text-white px-5 py-4 flex justify-between items-center">
              <div>
                <h5 className="font-bold text-base m-0">
                  รายละเอียดข้อมูลดิบ (Email / Raw Body)
                </h5>
                <p className="text-xs text-gray-300 m-0 mt-0.5">
                  ID: #{selectedRawTx.id}{' '}
                  {selectedRawTx.email_id ? `| Email ID: ${selectedRawTx.email_id}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRawTx(null)}
                className="text-gray-300 hover:text-white cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 block">ธนาคาร:</span>
                  <span className="font-semibold text-gray-800">
                    {selectedRawTx.bank || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">จำนวนเงิน:</span>
                  <span className="font-semibold text-gray-800">
                    ฿{Number(selectedRawTx.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">
                  ข้อความต้นฉบับ (raw_body):
                </label>
                <pre className="bg-gray-900 text-gray-100 p-3.5 rounded-xl text-xs whitespace-pre-wrap break-words max-h-60 overflow-y-auto font-mono">
                  {selectedRawTx.raw_body || 'ไม่มีข้อมูล raw_body'}
                </pre>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedRawTx(null)}
                className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
