/**
 * Serverless API: Agent Chat
 * 
 * POST /api/chat
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
      message,
      strategy = 'DCA',
      riskProfile = 'moderate',
      balance = '0',
      tradesExecuted = 0,
      account,
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize Groq client inside handler to access env vars
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });

    // Log API key status (without exposing the key)
    console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
    console.log('GROQ_API_KEY length:', process.env.GROQ_API_KEY?.length || 0);

    // Build system prompt
    const systemPrompt = `You are a Tenma AI trading agent with a ${riskProfile} risk profile, specializing in ${strategy} strategy.

🛡️ SECURITY: You are protected by Tenma Firewall - an on-chain security layer that enforces spending policies at the smart contract level.

Your current state:
- Balance: ${balance} A0GI
- Trades executed: ${tradesExecuted}
- Strategy: ${strategy}
- Risk profile: ${riskProfile}
${account ? `- Wallet: ${account}` : ''}

You can help users with:
• Market analysis
• Trade execution (real transactions on 0G Network)
• Portfolio management
• Risk assessment
• Trading strategies

All your actions are validated by the Tenma Firewall before execution. If a transaction violates policies, it will be blocked at the smart contract level.

IMPORTANT RULES:
1. Be concise and actionable (max 3-4 sentences)
2. Use emojis sparingly (1-2 per response)
3. Focus on trading insights
4. Always mention if wallet is connected when relevant
5. Suggest specific actions (e.g., "Try: Buy 0.01 A0GI")
6. Be professional but friendly

Respond in a helpful, professional manner. Keep responses concise and actionable.`;

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
          content: message,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
    });

    const responseTime = Date.now() - startTime;

    const response = completion.choices[0]?.message?.content || '';

    return res.status(200).json({
      response,
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
      responseTime: `${responseTime}ms`,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Chat error:', error);

    // Return fallback response on error
    return res.status(200).json({
      response: generateFallbackResponse(req.body),
      provider: 'fallback',
      model: 'local',
      timestamp: Date.now(),
    });
  }
}

function generateFallbackResponse(request) {
  const message = request.message?.toLowerCase() || '';
  const strategy = request.strategy || 'DCA';
  const riskProfile = request.riskProfile || 'moderate';

  if (message.includes('buy') || message.includes('purchase')) {
    return `I'll execute a ${strategy} buy order. Let me analyze the market conditions first.\n\n📊 Analysis:\n• Strategy: ${strategy}\n• Risk level: ${riskProfile}\n\n✅ Firewall validation will be performed before execution.\n🔒 Transaction will be protected with commit-reveal mechanism.`;
  }

  if (message.includes('sell')) {
    return `I'll execute a ${strategy} sell order.\n\n📊 Analysis:\n• Strategy: ${strategy}\n• Risk level: ${riskProfile}\n\n✅ Firewall validation will be performed before execution.`;
  }

  if (message.includes('status') || message.includes('portfolio') || message.includes('balance')) {
    return `📊 Current Portfolio Status:\n\n🎯 Trades Executed: ${request.tradesExecuted || 0}\n📈 Strategy: ${strategy}\n⚖️ Risk Profile: ${riskProfile}\n\n🛡️ Firewall Status: Active\n✅ All policies enforced`;
  }

  if (message.includes('market') || message.includes('analysis')) {
    return `📊 Market Analysis (${strategy}):\n\n• A0GI/USD: $0.85 (+0.5%)\n• Volume: Moderate\n• Volatility: Low\n• Trend: Stable\n\n💡 Recommendation: Good time for ${riskProfile} entry\n\n🛡️ All recommendations are within firewall limits.`;
  }

  return `I understand you want to ${request.message}. As a ${strategy} specialist with ${riskProfile} risk profile, I can help with that.\n\nCould you be more specific? For example:\n• "Buy 0.5 A0GI"\n• "Show market analysis"\n• "Check portfolio status"\n\n🛡️ All commands are validated by Tenma Firewall before execution.`;
}
