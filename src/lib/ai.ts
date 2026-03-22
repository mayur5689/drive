/**
 * OpenRouter AI Client — uses free models via the openrouter/free router.
 * Handles both standard and "thinking" models that put output in reasoning field.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const FREE_MODEL = 'openrouter/free';

/**
 * Extract text from an OpenRouter response, handling both standard and thinking models.
 */
function extractContent(data: any): string {
    const choice = data.choices?.[0]?.message;
    if (!choice) return '';

    if (choice.content && choice.content.trim()) {
        return choice.content.trim();
    }

    if (choice.reasoning && choice.reasoning.trim()) {
        return choice.reasoning.trim();
    }

    if (choice.reasoning_details?.length) {
        return choice.reasoning_details.map((d: any) => d.text || '').join('').trim();
    }

    return '';
}

/**
 * Call OpenRouter with a prompt. Returns { text } or { error }.
 */
export async function askAI(prompt: string): Promise<{ text?: string; error?: string }> {
    if (!OPENROUTER_API_KEY) {
        return { error: 'OPENROUTER_API_KEY is not set in .env.local' };
    }

    try {
        const res = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Cloud Storage'
            },
            body: JSON.stringify({
                model: FREE_MODEL,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant. Always respond directly and concisely. Never use markdown code fences unless asked.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 800,
                temperature: 0.7,
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('OpenRouter error:', res.status, errBody);
            if (res.status === 429) {
                return { error: 'AI is temporarily busy. Please try again in a few seconds.' };
            }
            return { error: `AI request failed (${res.status})` };
        }

        const data = await res.json();
        const text = extractContent(data);

        if (!text) {
            console.error('Empty AI response:', JSON.stringify(data));
            return { error: 'AI returned empty response. Try again.' };
        }

        return { text };
    } catch (error: any) {
        console.error('OpenRouter fetch error:', error);
        return { error: error.message || 'Failed to reach AI service' };
    }
}

/**
 * Call OpenRouter and parse JSON from the response.
 */
export async function askAIJSON(prompt: string): Promise<{ data?: any; error?: string }> {
    const fullPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no backticks, no explanation, no extra text. Just the raw JSON object.`;
    const result = await askAI(fullPrompt);

    if (result.error) return { error: result.error };

    try {
        let raw = (result.text || '').trim();
        raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return { data: JSON.parse(jsonMatch[0]) };
        }
        return { data: JSON.parse(raw) };
    } catch (err) {
        console.error('JSON parse failed. Raw text:', result.text);
        return { error: 'AI returned invalid format' };
    }
}
