const AMOUNT_PATTERNS = [
  /(?:人民币|CNY|RMB|￥|¥)\s*([0-9,]+\.?\d{0,2})/i,
  /([0-9,]+\.?\d{0,2})\s*(?:元|块)/,
  /(?:金额|消费|支出|收入|转账|付款|收款)[：:]\s*(?:￥|¥)?\s*([0-9,]+\.?\d{0,2})/,
  /(?:消费|支付|扣款|充值)\s*(?:￥|¥)?\s*([0-9,]+\.?\d{0,2})/,
];

const MERCHANT_PATTERNS = [
  /(?:在|于|向|至)\s*[「【]?(.{2,20}?)[」】]?\s*(?:消费|支付|付款|购买|交易)/,
  /(?:商户|商家|收款方|对方)[：:]\s*(.{2,20})/,
  /(?:摘要|备注|附言)[：:]\s*(.{2,30})/,
];

const TYPE_INCOME_KEYWORDS = ['收入', '转入', '到账', '收款', '退款', '红包', '工资', '奖金'];
const TYPE_EXPENSE_KEYWORDS = ['支出', '消费', '扣款', '付款', '转出', '支付', '购买', '充值'];

function extractAmount(text) {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (num > 0 && num < 10000000) return num;
    }
  }
  return null;
}

function extractMerchant(text) {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

function detectType(text) {
  const lower = text.toLowerCase();
  for (const kw of TYPE_INCOME_KEYWORDS) {
    if (lower.includes(kw)) return 'income';
  }
  for (const kw of TYPE_EXPENSE_KEYWORDS) {
    if (lower.includes(kw)) return 'expense';
  }
  return 'expense';
}

function extractDate(text) {
  const patterns = [
    /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/,
    /(\d{1,2})[月](\d{1,2})[日号]/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      if (m.length === 4) {
        return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
      }
      const year = new Date().getFullYear();
      return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
}

function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return String(Math.abs(hash));
}

export function parseTransactionText(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const amount = extractAmount(trimmed);
  if (!amount) return null;

  return {
    amount,
    note: extractMerchant(trimmed) || trimmed.slice(0, 50),
    type: detectType(trimmed),
    date: extractDate(trimmed),
    source: 'clipboard',
    isConfirmed: false,
    categoryId: null,
    tags: [],
    sourceHash: hashText(trimmed),
  };
}

export function parseMultipleTexts(text) {
  const lines = text.split(/\n+/).filter((l) => l.trim());
  const results = [];
  for (const line of lines) {
    const parsed = parseTransactionText(line);
    if (parsed) results.push(parsed);
  }
  if (results.length === 0) {
    const single = parseTransactionText(text);
    if (single) return [single];
  }
  return results;
}
