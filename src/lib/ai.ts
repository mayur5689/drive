/**
 * Mistral AI Client
 * Uses Mistral.ai API for AI-powered features
 */

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const MISTRAL_MODEL = 'mistral-small-latest';
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

/**
 * Call Mistral AI with a prompt. Returns { text } or { error }.
 */
export async function askAI(prompt: string): Promise<{ text?: string; error?: string }> {
    if (!MISTRAL_API_KEY) {
        return { error: 'MISTRAL_API_KEY is not set in .env.local' };
    }

    try {
        const res = await fetch(MISTRAL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MISTRAL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MISTRAL_MODEL,
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
            console.error('Mistral API error:', res.status, errBody);
            if (res.status === 429) {
                return { error: 'AI is temporarily busy. Please try again in a few seconds.' };
            }
            return { error: `AI request failed (${res.status})` };
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();

        if (!text) {
            console.error('Empty AI response:', JSON.stringify(data));
            return { error: 'AI returned empty response. Try again.' };
        }

        return { text };
    } catch (error: any) {
        console.error('Mistral API error:', error);
        return { error: error.message || 'Failed to reach AI service' };
    }
}

/**
 * Call Mistral and parse JSON from the response.
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
