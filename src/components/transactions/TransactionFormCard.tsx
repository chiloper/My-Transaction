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
  const [isOpen, setIsOpen] = useState(false);
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
      setIsOpen(false);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="app-card border border-indigo-100 hover:border-[#4361ee]/60 bg-white transition-all duration-200 mb-6 overflow-hidden shadow-2xs hover:shadow-xs">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full text-left px-5 py-3.5 flex items-center justify-between text-gray-800 hover:bg-indigo-50/30 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4361ee] text-white flex items-center justify-center text-sm shadow-xs shrink-0">
              <i className="fas fa-plus"></i>
            </div>
            <div>
              <h5 className="font-bold text-sm sm:text-base text-gray-900 m-0 flex items-center gap-2">
                บันทึกรายการใหม่
              </h5>
              <p className="text-xs text-gray-500 m-0 mt-0.5">
                กดที่นี่เพื่อเปิดแบบฟอร์มบันทึกรายรับ-รายจ่าย
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4361ee] bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shrink-0">
            <span>เปิดแบบฟอร์ม</span>
            <i className="fas fa-chevron-down text-[10px]"></i>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="app-card border-2 border-[#4361ee] overflow-hidden mb-6 shadow-xs animate-in fade-in duration-150">
      <div className="bg-[#4361ee] text-white px-5 sm:px-6 py-3.5 font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fas fa-plus-circle"></i>
          <span>บันทึกรายการใหม่</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          title="ซ่อนแบบฟอร์ม"
        >
          <span>ซ่อนแบบฟอร์ม</span>
          <i className="fas fa-chevron-up text-[10px]"></i>
        </button>
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
                    <label
                      htmlFor={`tx-date-${card.tempId}`}
                      className="block text-xs text-gray-500 mb-1"
                    >
                      วันที่และเวลา
                    </label>
                    <input
                      id={`tx-date-${card.tempId}`}
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
                    <label
                      htmlFor={`tx-type-${card.tempId}`}
                      className="block text-xs text-gray-500 mb-1"
                    >
                      ประเภท
                    </label>
                    <select
                      id={`tx-type-${card.tempId}`}
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
                    <label
                      htmlFor={`tx-bank-${card.tempId}`}
                      className="block text-xs text-gray-500 mb-1"
                    >
                      ธนาคาร / ช่องทาง (bank)
                    </label>
                    <input
                      id={`tx-bank-${card.tempId}`}
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
                    <label
                      htmlFor={`tx-amount-${card.tempId}`}
                      className="block text-xs text-gray-500 mb-1"
                    >
                      จำนวนเงิน (บาท)
                    </label>
                    <input
                      id={`tx-amount-${card.tempId}`}
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
                      id={`tx-desc-${card.tempId}`}
                      aria-label="รายละเอียดเพิ่มเติม"
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addDraftCard}
                className="px-4 py-2 rounded-full border border-gray-400 text-gray-600 hover:bg-gray-100 text-sm font-medium transition cursor-pointer"
              >
                <i className="fas fa-plus mr-1.5"></i>เพิ่มช่องกรอก
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 text-sm font-medium transition cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>

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
