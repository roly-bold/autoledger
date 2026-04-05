import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyTransaction } from '../aiClassification';

const CATEGORIES = [
  { id: 'cat-food', name: '餐饮', type: 'expense' },
  { id: 'cat-transport', name: '交通', type: 'expense' },
  { id: 'cat-shopping', name: '购物', type: 'expense' },
];

const SETTINGS = {
  aiApiKey: 'sk-test-key',
  aiApiEndpoint: 'https://api.example.com/v1/chat/completions',
  aiModel: 'gpt-3.5-turbo',
};

function mockFetchSuccess(category, confidence = 0.95) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content: JSON.stringify({ category, confidence }) } }],
    }),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('classifyTransaction', () => {
  it('returns null when no API key', async () => {
    const result = await classifyTransaction('星巴克拿铁', CATEGORIES, { ...SETTINGS, aiApiKey: '' });
    expect(result).toEqual({ categoryId: null, confidence: 0 });
  });

  it('returns null when API key is undefined', async () => {
    const result = await classifyTransaction('午餐', CATEGORIES, { aiApiEndpoint: '', aiModel: '' });
    expect(result).toEqual({ categoryId: null, confidence: 0 });
  });

  it('classifies successfully and returns matched category', async () => {
    globalThis.fetch = mockFetchSuccess('餐饮', 0.95);

    const result = await classifyTransaction('星巴克拿铁 38元', CATEGORIES, SETTINGS);
    expect(result).toEqual({ categoryId: 'cat-food', confidence: 0.95 });
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('sends correct request body', async () => {
    globalThis.fetch = mockFetchSuccess('交通');

    await classifyTransaction('打车去公司', CATEGORIES, SETTINGS);

    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe(SETTINGS.aiApiEndpoint);
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe(`Bearer ${SETTINGS.aiApiKey}`);

    const body = JSON.parse(options.body);
    expect(body.model).toBe('gpt-3.5-turbo');
    expect(body.messages[0].content).toContain('餐饮');
    expect(body.messages[0].content).toContain('交通');
    expect(body.messages[1].content).toBe('打车去公司');
  });

  it('returns null categoryId when category name not found', async () => {
    globalThis.fetch = mockFetchSuccess('不存在的分类', 0.8);

    const result = await classifyTransaction('测试', CATEGORIES, SETTINGS);
    expect(result).toEqual({ categoryId: null, confidence: 0.8 });
  });

  it('handles API returning non-ok status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

    const result = await classifyTransaction('午餐', CATEGORIES, SETTINGS);
    expect(result).toEqual({ categoryId: null, confidence: 0 });
  });

  it('handles malformed JSON in response content', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '这不是JSON' } }],
      }),
    });

    const result = await classifyTransaction('午餐', CATEGORIES, SETTINGS);
    expect(result).toEqual({ categoryId: null, confidence: 0 });
  });

  it('handles empty choices array', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [] }),
    });

    const result = await classifyTransaction('午餐', CATEGORIES, SETTINGS);
    expect(result).toEqual({ categoryId: null, confidence: 0 });
  });

  it('handles network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await classifyTransaction('午餐', CATEGORIES, SETTINGS);
    expect(result).toEqual({ categoryId: null, confidence: 0 });
  });

  it('handles response with confidence missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '{"category": "餐饮"}' } }],
      }),
    });

    const result = await classifyTransaction('午餐', CATEGORIES, SETTINGS);
    expect(result).toEqual({ categoryId: 'cat-food', confidence: 0 });
  });
});
