'use client';

import React, { useMemo } from 'react';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: Readonly<PaginationBarProps>) {
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (safeCurrentPage > 3) pages.push('...');
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safeCurrentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [totalPages, safeCurrentPage]);

  if (totalItems === 0) return null;

  const startItemNum = (safeCurrentPage - 1) * pageSize + 1;
  const endItemNum = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-xs sm:text-sm text-gray-500">
        แสดงรายการที่{' '}
        <span className="font-semibold text-gray-700">
          {startItemNum.toLocaleString()}
        </span>{' '}
        -{' '}
        <span className="font-semibold text-gray-700">
          {endItemNum.toLocaleString()}
        </span>{' '}
        จากทั้งหมด{' '}
        <span className="font-semibold text-gray-700">
          {totalItems.toLocaleString()}
        </span>{' '}
        รายการ
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage <= 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium transition cursor-pointer"
        >
          <i className="fas fa-chevron-left mr-1"></i>ก่อนหน้า
        </button>

        {pageNumbers.map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}-${safeCurrentPage}`}
              className="px-2 py-1 text-xs text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`min-w-[34px] h-[34px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                safeCurrentPage === page
                  ? 'bg-[#4361ee] text-white shadow-xs'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium transition cursor-pointer"
        >
          ถัดไป<i className="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  );
}
