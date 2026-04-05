import { parseTransactionText } from './textParsing';

const AMOUNT_HINT = /[\d,.]+\s*(?:元|块)|(?:¥|￥|CNY|RMB)\s*[\d,.]+|(?:金额|消费|支出|收入|转账|付款)[：:]/i;

export function looksLikeTransaction(text) {
  if (!text || text.length < 4 || text.length > 500) return false;
  return AMOUNT_HINT.test(text);
}

export async function readClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    return text?.trim() || '';
  } catch {
    return '';
  }
}

export async function checkClipboardForTransaction() {
  const text = await readClipboard();
  if (!looksLikeTransaction(text)) return null;
  return parseTransactionText(text);
}
