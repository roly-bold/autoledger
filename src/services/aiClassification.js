export async function classifyTransaction(note, categories, settings) {
  if (!settings.aiApiKey) return { categoryId: null, confidence: 0 };

  const categoryNames = categories.map((c) => c.name);

  try {
    const res = await fetch(settings.aiApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.aiApiKey}`,
      },
      body: JSON.stringify({
        model: settings.aiModel || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一个记账分类助手。从给定分类中选择最匹配的一个。可选分类: ${categoryNames.join('、')}。请只返回 JSON 格式: {"category": "分类名", "confidence": 0.95}`,
          },
          { role: 'user', content: note },
        ],
        temperature: 0.1,
        max_tokens: 60,
      }),
    });

    if (!res.ok) return { categoryId: null, confidence: 0 };

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return { categoryId: null, confidence: 0 };

    const parsed = JSON.parse(jsonMatch[0]);
    const matched = categories.find((c) => c.name === parsed.category);
    return {
      categoryId: matched?.id || null,
      confidence: parsed.confidence || 0,
    };
  } catch {
    return { categoryId: null, confidence: 0 };
  }
}
