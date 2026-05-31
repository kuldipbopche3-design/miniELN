import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { content, title } = await req.json();
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      // Mock summary fallback if no API key is present
      const cleanText = content.replace(/<[^>]*>/g, ' ').trim();
      const words = cleanText.split(/\s+/).filter(Boolean);
      
      const objective = `Objective: Investigation of the target system properties related to ${title || 'this experiment'}.`;
      const observations = words.length > 5 
        ? `Observations: Documented trial parameters including local observations: "${words.slice(0, 10).join(' ')}..."` 
        : 'Observations: Monitored standard procedural steps.';
      const result = 'Result: Successful completion under default regulatory and quality control limits.';
      
      // Artificial delay to mimic API call
      await new Promise((resolve) => setTimeout(resolve, 600));

      return NextResponse.json({ 
        summary: `${objective} ${observations} ${result}`,
        isMock: true
      });
    }

    // Call Google Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a scientific AI assistant. Provide a brief 3-sentence summary of the following laboratory notebook entry. Highlight the objective, the key observations, and the final results. Keep it professional. Title: ${title || 'Untitled'}. Content: ${content}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const json = await response.json();
    const summaryText = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summaryText) {
      throw new Error('Invalid response candidate from Gemini API');
    }

    return NextResponse.json({ 
      summary: summaryText.trim(),
      isMock: false
    });
  } catch (err: any) {
    console.error('Gemini AI summary failed:', err);
    return NextResponse.json({ error: err.message || 'Summarization failed' }, { status: 500 });
  }
}
