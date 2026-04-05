import { describe, it, expect } from 'vitest';
import { parseTransactionText, parseMultipleTexts } from '../textParsing';

describe('parseTransactionText', () => {
  describe('amount extraction', () => {
    it('parses ¥ prefix', () => {
      const r = parseTransactionText('支付宝消费¥38.50');
      expect(r.amount).toBe(38.5);
    });

    it('parses 元 suffix', () => {
      const r = parseTransactionText('消费128.00元');
      expect(r.amount).toBe(128);
    });

    it('parses CNY prefix', () => {
      const r = parseTransactionText('CNY 250.00 交易成功');
      expect(r.amount).toBe(250);
    });

    it('parses 金额: format', () => {
      const r = parseTransactionText('金额：¥99.90');
      expect(r.amount).toBe(99.9);
    });

    it('parses comma-separated amounts', () => {
      const r = parseTransactionText('消费1,280.50元');
      expect(r.amount).toBe(1280.5);
    });

    it('returns null for no amount', () => {
      expect(parseTransactionText('没有金额的文本')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseTransactionText('')).toBeNull();
    });

    it('returns null for whitespace only', () => {
      expect(parseTransactionText('   ')).toBeNull();
    });
  });

  describe('merchant extraction', () => {
    it('extracts "在X消费" pattern', () => {
      const r = parseTransactionText('您在星巴克消费38.00元');
      expect(r.note).toBe('星巴克');
    });

    it('extracts "商户:" pattern', () => {
      const r = parseTransactionText('消费100元 商户：麦当劳');
      expect(r.note).toBe('麦当劳');
    });

    it('falls back to truncated text when no merchant', () => {
      const r = parseTransactionText('¥50.00');
      expect(r.note).toBe('¥50.00');
    });
  });

  describe('type detection', () => {
    it('detects expense keywords', () => {
      expect(parseTransactionText('消费¥100').type).toBe('expense');
      expect(parseTransactionText('支付50元').type).toBe('expense');
      expect(parseTransactionText('扣款¥200').type).toBe('expense');
    });

    it('detects income keywords', () => {
      expect(parseTransactionText('收入¥5000').type).toBe('income');
      expect(parseTransactionText('到账¥3000').type).toBe('income');
      expect(parseTransactionText('退款50元').type).toBe('income');
    });

    it('defaults to expense', () => {
      expect(parseTransactionText('¥100').type).toBe('expense');
    });
  });

  describe('date extraction', () => {
    it('parses YYYY年MM月DD日', () => {
      const r = parseTransactionText('2026年4月5日消费¥100');
      expect(r.date).toBe('2026-04-05');
    });

    it('parses YYYY-MM-DD', () => {
      const r = parseTransactionText('2026-03-28 消费¥50');
      expect(r.date).toBe('2026-03-28');
    });

    it('parses MM月DD日 with current year', () => {
      const r = parseTransactionText('3月15日消费¥80');
      const year = new Date().getFullYear();
      expect(r.date).toBe(`${year}-03-15`);
    });

    it('defaults to today when no date', () => {
      const r = parseTransactionText('消费¥100');
      expect(r.date).toBe(new Date().toISOString().slice(0, 10));
    });
  });

  describe('output fields', () => {
    it('sets correct defaults', () => {
      const r = parseTransactionText('消费¥100');
      expect(r.source).toBe('clipboard');
      expect(r.isConfirmed).toBe(false);
      expect(r.categoryId).toBeNull();
      expect(r.tags).toEqual([]);
      expect(r.sourceHash).toBeTruthy();
    });

    it('generates consistent hash for same text', () => {
      const a = parseTransactionText('消费¥100');
      const b = parseTransactionText('消费¥100');
      expect(a.sourceHash).toBe(b.sourceHash);
    });

    it('generates different hash for different text', () => {
      const a = parseTransactionText('消费¥100');
      const b = parseTransactionText('消费¥200');
      expect(a.sourceHash).not.toBe(b.sourceHash);
    });
  });

  describe('real-world messages', () => {
    it('parses bank SMS', () => {
      const r = parseTransactionText('【招商银行】您在美团消费人民币35.50，余额1234.56');
      expect(r.amount).toBe(35.5);
      expect(r.note).toBe('美团');
      expect(r.type).toBe('expense');
    });

    it('parses Alipay notification', () => {
      const r = parseTransactionText('支付宝：您向全家便利店付款¥12.00');
      expect(r.amount).toBe(12);
      expect(r.type).toBe('expense');
    });

    it('parses salary notification', () => {
      const r = parseTransactionText('工资到账¥15,000.00');
      expect(r.amount).toBe(15000);
      expect(r.type).toBe('income');
    });
  });
});

describe('parseMultipleTexts', () => {
  it('parses multiple lines', () => {
    const text = '消费¥50\n收入¥100\n消费¥30';
    const results = parseMultipleTexts(text);
    expect(results).toHaveLength(3);
  });

  it('skips lines without amounts', () => {
    const text = '消费¥50\n没有金额\n消费¥30';
    const results = parseMultipleTexts(text);
    expect(results).toHaveLength(2);
  });

  it('falls back to single parse for one block', () => {
    const text = '您在星巴克消费38.00元';
    const results = parseMultipleTexts(text);
    expect(results).toHaveLength(1);
    expect(results[0].amount).toBe(38);
  });

  it('returns empty for no parseable text', () => {
    expect(parseMultipleTexts('没有任何金额')).toHaveLength(0);
  });
});
