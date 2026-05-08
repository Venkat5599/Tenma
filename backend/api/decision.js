/**
 * Serverless API: Agent Decision
 * 
 * POST /api/decision
 */

import Groq from 'groq-sdk';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      strategy = 'DCA',
      riskProfile = 'moderate',
      balance = '0',
      tradesExecuted = 0,
      account,
    } = req.body;

    // Initialize Groq client inside handler to access env vars
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });

    // Build system prompt
    const systemPrompt = `You are a Tenma AI autonomous trading agent with a ${riskProfile} risk profile.

🛡️ SECURITY: You are protected by Tenma Firewall - an on-chain security layer that enforces spending policies.

Your strategy: ${strategy}

Risk Management Rules:
- Risk profile: ${riskProfile}
- Current balance: ${balance} A0GI
- Trades executed: ${tradesExecuted}

🔒 FIREWALL PROTECTION:
All your transactions are validated against on-chain policies BEFORE execution:
1. Amount limits (max per transaction, daily caps)
2. Contract whitelist/blacklist
3. Risk score validation
4. Time-based restrictions
5. MEV protection via commit-reveal (5-minute delay)

You must respond with a JSON object:
{
  "action": "buy" | "sell" | "hold" | "wait",
  "token": "token address (use 0x0000000000000000000000000000000000000000 for native A0GI)",
  "amount": "amount in A0GI (string)",
  "reasoning": "detailed explanation of your decision",
  "confidence": 0.0 to 1.0,
  "urgency": "low" | "medium" | "high"
}

IMPORTANT: Be conservative. The firewall will block risky transactions, but you should still make sound decisions.`;

    const userPrompt = `Your Current State:
- Balance: ${balance} A0GI
- Trades Executed: ${tradesExecuted}
- Strategy: ${strategy}
- Risk Profile: ${riskProfile}

Based on this information and your ${strategy} strategy, what trading action should you take right now?

Remember: The Tenma Firewall will validate your transaction against on-chain policies. If it violates any rule, it will be blocked automatically.`;

    // Call Groq API
    const startTime = Date.now();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      response_format: { type: 'json_object' },
    });

    const responseTime = Date.now() - startTime;

    const content = completion.choices[0]?.message?.content || '{}';
    const decisionData = JSON.parse(content);

    return res.status(200).json({
      decision: {
        ...decisionData,
        timestamp: Date.now(),
      },
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
      responseTime: `${responseTime}ms`,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Decision error:', error);

    // Return safe fallback decision
    return res.status(200).json({
      decision: {
        action: 'hold',
        token: '0x0000000000000000000000000000000000000000',
        amount: '0',
        reasoning: 'Error making decision, defaulting to hold for safety',
        confidence: 0,
        urgency: 'low',
        timestamp: Date.now(),
      },
      provider: 'fallback',
      model: 'local',
      timestamp: Date.now(),
    });
  }
}
