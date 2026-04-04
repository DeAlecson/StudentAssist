const AI = (() => {
  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-haiku-4-5-20251001';

  // Haiku pricing (per million tokens, USD)
  const PRICE_IN  = 0.80;  // $0.80 / 1M input tokens
  const PRICE_OUT = 4.00;  // $4.00 / 1M output tokens

  const _recordUsage = (moduleId, inputTokens, outputTokens) => {
    if (!moduleId || (!inputTokens && !outputTokens)) return;
    try {
      Storage.updateProgress(moduleId, p => {
        if (!p.tokenUsage) p.tokenUsage = { inputTokens: 0, outputTokens: 0, calls: 0 };
        p.tokenUsage.inputTokens  += (inputTokens  || 0);
        p.tokenUsage.outputTokens += (outputTokens || 0);
        p.tokenUsage.calls        += 1;
        return p;
      });
    } catch (e) { /* silent */ }
  };

  const complete = async (systemPrompt, userPrompt, maxTokens = 800, moduleId = null) => {
    const key = Storage.getApiKey();
    if (!key) throw new Error('No API key');

    // Infer moduleId from State if not passed in
    const mid = moduleId || (typeof State !== 'undefined' ? State.get('currentModule') : null);

    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${resp.status}`);
    }

    const data = await resp.json();

    // Record usage from actual API response
    const usage = data.usage || {};
    _recordUsage(mid, usage.input_tokens, usage.output_tokens);

    return data.content[0].text;
  };

  const isAvailable = () => !!Storage.getApiKey();

  // Return cost estimate string for given token counts
  const estimateCost = (inputTokens, outputTokens) => {
    const cost = ((inputTokens / 1e6) * PRICE_IN) + ((outputTokens / 1e6) * PRICE_OUT);
    if (cost < 0.001) return '< $0.001';
    return '$' + cost.toFixed(4);
  };

  return { complete, isAvailable, estimateCost, PRICE_IN, PRICE_OUT };
})();
