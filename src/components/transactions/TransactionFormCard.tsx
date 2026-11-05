'use client';

import React, { useState } from 'react';
import { BANK_CONFIG, NewTransactionInput } from '@/types/transaction';
import { getDefaultDateTimeLocal } from '@/utils/dateUtils';

interface TransactionFormCardProps {
  bankOptions: string[];
  onAddTransactions: (items: NewTransactionInput[]) => Promise<void>;
  onSuccess?: () => void;
}

interface DraftCard extends NewTransactionInput {
  tempId: number;
}

function createInitialDraft(tempId = Date.now()): DraftCard {
  return {
    tempId,
    transaction_date: getDefaultDateTimeLocal(),
    type: 'expense',
    bank: 'KBank',
    amount: 0,
    description: '',
  };
}

export default function TransactionFormCard({
  bankOptions,
  onAddTransactions,
  onSuccess,
}: Readonly<TransactionFormCardProps>) {
  const [drafts, setDrafts] = useState<DraftCard[]>(() => [createInitialDraft(1)]);
  const [submitting, setSubmitting] = useState(false);

  const addDraftCard = () => {
    setDrafts((prev) => [...prev, createInitialDraft(Date.now() + Math.random())]);
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
      await onAddTransactions(valid.map(({ tempId: _, ...rest }) => rest));
      setDrafts([createInitialDraft()]);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
                          Number.parseFloat(e.target.value) || 0
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
  );
}
