export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  email_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  transaction_date: string | null;
  raw_body: string | null;
  created_at: string;
  bank: string | null;
}

export interface NewTransactionInput {
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  bank: string;
  email_id?: string | null;
  raw_body?: string | null;
}

export const BANK_CONFIG: Record<string, { label: string; color: string; bgLight: string }> = {
  KBank: { label: 'กสิกรไทย (KBank)', color: '#138f2d', bgLight: '#e8f5e9' },
  SCB: { label: 'ไทยพาณิชย์ (SCB)', color: '#4e2e7f', bgLight: '#f3e5f5' },
  Krungthai: { label: 'กรุงไทย (KTB)', color: '#00a5e5', bgLight: '#e1f5fe' },
  BBL: { label: 'กรุงเทพ (BBL)', color: '#1e4598', bgLight: '#e8eaf6' },
  Krungsri: { label: 'กรุงศรี (BAY)', color: '#f5a623', bgLight: '#fff8e1' },
  TTB: { label: 'ทีเอ็มบีธนชาต (ttb)', color: '#0050f0', bgLight: '#e3f2fd' },
  GSB: { label: 'ออมสิน (GSB)', color: '#eb198d', bgLight: '#fce4ec' },
  TrueMoney: { label: 'TrueMoney', color: '#ff6600', bgLight: '#fff3e0' },
  PromptPay: { label: 'พร้อมเพย์ (PromptPay)', color: '#1a3c7a', bgLight: '#e8eaf6' },
  Cash: { label: 'เงินสด (Cash)', color: '#2ecc71', bgLight: '#eafaf1' },
};

export const CHART_PALETTE = [
  '#4361ee',
  '#2ecc71',
  '#f72585',
  '#4cc9f0',
  '#f8961e',
  '#7209b7',
  '#e63946',
  '#3a0ca3',
  '#00b4d8',
  '#ff9f1c',
  '#2ec4b6',
  '#9b5de5',
];

export function getBankColor(bankName: string | null | undefined, index = 0): string {
  if (!bankName) return CHART_PALETTE[index % CHART_PALETTE.length];
  const normalized = bankName.trim();
  if (BANK_CONFIG[normalized]) {
    return BANK_CONFIG[normalized].color;
  }
  const lower = normalized.toLowerCase();
  if (lower.includes('kbank') || lower.includes('กสิกร') || lower.includes('kasikorn')) return '#138f2d';
  if (lower.includes('scb') || lower.includes('ไทยพาณิชย์')) return '#4e2e7f';
  if (lower.includes('ktb') || lower.includes('krungthai') || lower.includes('กรุงไทย')) return '#00a5e5';
  if (lower.includes('bbl') || lower.includes('bangkok') || lower.includes('กรุงเทพ')) return '#1e4598';
  if (lower.includes('bay') || lower.includes('krungsri') || lower.includes('กรุงศรี')) return '#f5a623';
  if (lower.includes('ttb') || lower.includes('tmb') || lower.includes('ทหารไทย')) return '#0050f0';
  if (lower.includes('gsb') || lower.includes('ออมสิน')) return '#eb198d';
  if (lower.includes('truemoney') || lower.includes('ทรูมันนี่')) return '#ff6600';
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
