'use client';

import React from 'react';

interface ErrorBannerProps {
  message: string | null;
  onRetry: () => void;
}

export default function ErrorBanner({
  message,
  onRetry,
}: Readonly<ErrorBannerProps>) {
  if (!message) return null;

  return (
    <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <i className="fas fa-exclamation-circle text-rose-600"></i>
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition cursor-pointer shrink-0"
      >
        ลองใหม่
      </button>
    </div>
  );
}
