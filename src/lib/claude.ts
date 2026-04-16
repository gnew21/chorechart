const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY as string

export interface ChoreDetectionResult {
  chore_name: string
  confidence: 'high' | 'medium' | 'low'
}

export async function detectChoreFromImage(base64Image: string): Promise<ChoreDetectionResult> {
  if (!CLAUDE_API_KEY) throw new Error('Missing Claude API key')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Look at this image and identify the household chore being done or completed. Respond with JSON only: {"chore_name": "<name>", "confidence": "high"|"medium"|"low"}. chore_name should be a simple phrase like "washing dishes", "vacuuming", "taking out trash". If you cannot identify a chore, use chore_name: "unknown" and confidence: "low".',
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in Claude response')
  return JSON.parse(match[0]) as ChoreDetectionResult
}
