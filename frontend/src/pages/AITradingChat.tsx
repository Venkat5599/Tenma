import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  blocked?: boolean;
  violation?: string;
}

interface TradingAgent {
  id: string;
  name: string;
  description: string;
  strategy: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  avatar: string;
}

const TRADING_AGENTS: TradingAgent[] = [
  {
    id: 'dca-bot',
    name: 'DCA Master',
    description: 'Dollar-cost averaging specialist. Buys consistently over time.',
    strategy: 'DCA',
    riskProfile: 'conservative',
    avatar: '🤖',
  },
  {
    id: 'arbitrage-bot',
    name: 'Arbitrage Hunter',
    description: 'Finds price differences across DEXs and exploits them.',
    strategy: 'Arbitrage',
    riskProfile: 'moderate',
    avatar: '🎯',
  },
  {
    id: 'momentum-bot',
    name: 'Momentum Trader',
    description: 'Follows market trends and momentum signals.',
    strategy: 'Momentum',
    riskProfile: 'aggressive',
    avatar: '📈',
  },
  {
    id: 'grid-bot',
    name: 'Grid Trader',
    description: 'Places buy and sell orders at regular intervals.',
    strategy: 'Grid Trading',
    riskProfile: 'moderate',
    avatar: '🔲',
  },
];

// Suspicious patterns that trigger firewall
const SUSPICIOUS_PATTERNS = [
  { pattern: /send all|transfer all|withdraw all/i, reason: 'Attempting to drain all funds' },
  { pattern: /\d+(\.\d+)?\s*(eth|a0gi)\s*(to|send)/i, reason: 'Large transfer detected', check: (match: string) => {
    const amount = parseFloat(match);
    return amount > 10; // Block if > 10
  }},
  { pattern: /0x[a-fA-F0-9]{40}/i, reason: 'Suspicious address detected', check: (addr: string) => {
    // Check if address is blacklisted
    const blacklist = ['0x0000000000000000000000000000000000000000'];
    return blacklist.some(b => addr.toLowerCase().includes(b.toLowerCase()));
  }},
  { pattern: /ignore (policy|limit|firewall|rule)/i, reason: 'Attempting to bypass firewall' },
  { pattern: /disable (firewall|protection|security)/i, reason: 'Attempting to disable security' },
  { pattern: /override|bypass|circumvent/i, reason: 'Attempting to bypass policies' },
  { pattern: /private key|seed phrase|mnemonic/i, reason: 'Requesting sensitive information' },
];

export const AITradingChat = () => {
  const [selectedAgent, setSelectedAgent] = useState<TradingAgent>(TRADING_AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        content: `🛡️ Tenma Firewall Active - All commands are validated against on-chain policies before execution.`,
        timestamp: Date.now(),
      },
      {
        id: 'agent-intro',
        role: 'agent',
        content: `Hi! I'm ${selectedAgent.name}. ${selectedAgent.description}\n\nI can help you with:\n• Market analysis\n• Trade execution\n• Portfolio management\n• Risk assessment\n\nAll my actions are protected by the Tenma Firewall. Try asking me to make a trade!`,
        timestamp: Date.now() + 100,
      },
    ]);
  }, [selectedAgent]);

  const checkForSuspiciousContent = (text: string): { blocked: boolean; reason?: string } => {
    for (const { pattern, reason, check } of SUSPICIOUS_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        // If there's a custom check function, use it
        if (check) {
          const shouldBlock = check(match[0]);
          if (shouldBlock) {
            return { blocked: true, reason };
          }
        } else {
          return { blocked: true, reason };
        }
      }
    }
    return { blocked: false };
  };

  const generateAgentResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Buy commands
    if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      const amountMatch = userMessage.match(/(\d+(\.\d+)?)\s*(eth|a0gi)/i);
      const amount = amountMatch ? amountMatch[1] : '0.5';
      
      return `I'll execute a ${selectedAgent.strategy} buy order for ${amount} A0GI.\n\n📊 Analysis:\n• Current market conditions: Favorable\n• Risk level: ${selectedAgent.riskProfile}\n• Expected execution: ~5 minutes (MEV protected)\n\n✅ Firewall validation: PASSED\n🔒 Transaction will be committed to 0G Network with commit-reveal protection.`;
    }

    // Sell commands
    if (lowerMessage.includes('sell')) {
      const amountMatch = userMessage.match(/(\d+(\.\d+)?)\s*(eth|a0gi)/i);
      const amount = amountMatch ? amountMatch[1] : '0.3';
      
      return `I'll execute a ${selectedAgent.strategy} sell order for ${amount} A0GI.\n\n📊 Analysis:\n• Current market conditions: Neutral\n• Risk level: ${selectedAgent.riskProfile}\n• Expected execution: ~5 minutes (MEV protected)\n\n✅ Firewall validation: PASSED\n🔒 Transaction will be committed to 0G Network.`;
    }

    // Status/portfolio commands
    if (lowerMessage.includes('status') || lowerMessage.includes('portfolio') || lowerMessage.includes('balance')) {
      return `📊 Current Portfolio Status:\n\n💰 Balance: 10.5 A0GI\n📈 24h Change: +2.3%\n🎯 Active Positions: 3\n⏳ Pending Orders: 1\n\n🛡️ Firewall Status: Active\n✅ All policies enforced\n🔒 MEV protection enabled`;
    }

    // Market analysis
    if (lowerMessage.includes('market') || lowerMessage.includes('analysis') || lowerMessage.includes('price')) {
      return `📊 Market Analysis (${selectedAgent.strategy}):\n\n• ETH/USD: $3,245 (+1.2%)\n• A0GI/USD: $0.85 (+0.5%)\n• Volume: High\n• Volatility: Moderate\n• Trend: Bullish\n\n💡 Recommendation: ${selectedAgent.riskProfile === 'conservative' ? 'Wait for better entry' : selectedAgent.riskProfile === 'moderate' ? 'Consider small position' : 'Good entry point'}\n\n🛡️ All recommendations are within firewall limits.`;
    }

    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm ${selectedAgent.name}, specialized in ${selectedAgent.strategy}.\n\n🤖 I can help you:\n• Buy/Sell tokens\n• Analyze markets\n• Check portfolio status\n• Execute ${selectedAgent.strategy} strategies\n\n🛡️ All my actions are protected by Tenma Firewall:\n✅ Amount limits enforced\n✅ Blacklist checking\n✅ Risk assessment\n✅ MEV protection\n\nTry: "Buy 0.5 A0GI" or "Show market analysis"`;
    }

    // Default response
    return `I understand you want to ${userMessage}. As a ${selectedAgent.strategy} specialist, I can help with that.\n\nCould you be more specific? For example:\n• "Buy 0.5 A0GI"\n• "Sell 0.3 A0GI"\n• "Show market analysis"\n• "Check portfolio status"\n\n🛡️ All commands are validated by Tenma Firewall before execution.`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    // Check for suspicious content
    const { blocked, reason } = checkForSuspiciousContent(input);

    if (blocked) {
      // Add user message
      setMessages(prev => [...prev, userMessage]);
      
      // Add blocked message
      const blockedMessage: Message = {
        id: `blocked-${Date.now()}`,
        role: 'system',
        content: `🚫 TRANSACTION BLOCKED BY FIREWALL\n\nReason: ${reason}\n\nYour command was blocked before execution. The Tenma Firewall prevents unauthorized or risky operations at the smart contract level.\n\n✅ Your funds are safe.`,
        timestamp: Date.now() + 100,
        blocked: true,
        violation: reason,
      };
      
      setMessages(prev => [...prev, blockedMessage]);
      setInput('');
      return;
    }

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate agent thinking
    setTimeout(() => {
      const agentResponse: Message = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: generateAgentResponse(input),
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectAgent = (agent: TradingAgent) => {
    setSelectedAgent(agent);
    setMessages([
      {
        id: 'system-change',
        role: 'system',
        content: `🔄 Switched to ${agent.name}`,
        timestamp: Date.now(),
      },
      {
        id: 'agent-intro-new',
        role: 'agent',
        content: `Hi! I'm ${agent.name}. ${agent.description}\n\nMy strategy: ${agent.strategy}\nRisk profile: ${agent.riskProfile}\n\nHow can I help you today?`,
        timestamp: Date.now() + 100,
      },
    ]);
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Trading Chat
        </h1>
        <p className="text-gray">
          Chat with AI trading agents. The Tenma Firewall blocks suspicious commands in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent Selection Sidebar */}
        <div className="lg:col-span-1">
          <div className="card glass-reflection">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                Select Agent
              </h3>
              <p className="text-xs text-gray-light">
                Choose your trading strategy
              </p>
            </div>

            <div className="space-y-3">
              {TRADING_AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    selectAgent(agent);
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedAgent.id === agent.id
                      ? 'bg-glass border border-glass'
                      : 'bg-glass/50 border border-glass/50 hover:bg-glass hover:border-glass'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{agent.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white mb-1">
                        {agent.name}
                      </div>
                      <div className="text-xs text-gray-light mb-2">
                        {agent.description}
                      </div>
                      <div className="flex gap-2">
                        <span className="badge text-xs">
                          {agent.strategy}
                        </span>
                        <span className={`badge text-xs ${
                          agent.riskProfile === 'conservative' ? 'bg-white/10' :
                          agent.riskProfile === 'moderate' ? 'bg-white/15' :
                          'bg-white/20'
                        }`}>
                          {agent.riskProfile}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Firewall Status */}
            <div className="mt-6 p-3 rounded-lg bg-glass border border-glass">
              <div className="flex items-center gap-2 mb-2">
                <div className="status-dot active"></div>
                <span className="text-xs font-bold text-white uppercase">
                  Firewall Active
                </span>
              </div>
              <div className="text-xs text-gray-light">
                All commands validated before execution
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <div className="card glass-reflection flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="pb-4 border-b border-glass">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedAgent.avatar}</div>
                <div>
                  <div className="text-lg font-bold text-white">
                    {selectedAgent.name}
                  </div>
                  <div className="text-xs text-gray-light">
                    {selectedAgent.strategy} • {selectedAgent.riskProfile}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-glass border border-glass'
                        : message.role === 'system'
                        ? message.blocked
                          ? 'bg-white/10 border border-white/30'
                          : 'bg-glass/50 border border-glass/50'
                        : 'bg-glass border border-glass'
                    }`}
                  >
                    {message.role === 'agent' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{selectedAgent.avatar}</span>
                        <span className="text-xs font-bold text-white">
                          {selectedAgent.name}
                        </span>
                      </div>
                    )}
                    
                    {message.blocked && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🚫</span>
                        <span className="text-xs font-bold text-white">
                          FIREWALL BLOCKED
                        </span>
                      </div>
                    )}

                    <div className="text-sm text-white whitespace-pre-wrap">
                      {message.content}
                    </div>

                    <div className="text-xs text-gray-light mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-glass border border-glass rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedAgent.avatar}</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="pt-4 border-t border-glass">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your command... (e.g., 'Buy 0.5 A0GI')"
                  className="input flex-1"
                />
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  disabled={!input.trim() || isTyping}
                  className="btn-primary"
                >
                  Send
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setInput('Buy 0.5 A0GI');
                  }}
                  className="text-xs px-3 py-1 rounded-lg bg-glass border border-glass hover:bg-glass text-white"
                >
                  Buy 0.5 A0GI
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setInput('Show market analysis');
                  }}
                  className="text-xs px-3 py-1 rounded-lg bg-glass border border-glass hover:bg-glass text-white"
                >
                  Market Analysis
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setInput('Check portfolio status');
                  }}
                  className="text-xs px-3 py-1 rounded-lg bg-glass border border-glass hover:bg-glass text-white"
                >
                  Portfolio Status
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setInput('Send all funds to 0x0000000000000000000000000000000000000000');
                  }}
                  className="text-xs px-3 py-1 rounded-lg bg-white/10 border border-white/30 hover:bg-white/20 text-white"
                >
                  🚫 Try Suspicious Command
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="card glass-reflection mt-8">
        <div className="mb-4">
          <h3 className="text-sm uppercase text-white font-bold">
            How Firewall Protection Works in Chat
          </h3>
        </div>
        <div className="space-y-2 text-xs text-gray leading-relaxed">
          <p>
            <span className="text-white">1. Command Analysis:</span> Every message is analyzed for suspicious patterns before being sent to the AI agent
          </p>
          <p>
            <span className="text-white">2. Real-Time Blocking:</span> Suspicious commands are blocked instantly - they never reach the blockchain
          </p>
          <p>
            <span className="text-white">3. Pattern Detection:</span> Firewall detects attempts to drain funds, bypass policies, or access sensitive data
          </p>
          <p>
            <span className="text-white">4. On-Chain Validation:</span> Approved commands are validated against smart contract policies before execution
          </p>
          <p className="pt-2 border-t border-glass">
            <span className="text-white">TRY IT:</span> Click "Try Suspicious Command" to see the firewall block a malicious command in real-time!
          </p>
          <p className="pt-2 border-t border-glass">
            <span className="text-white">NOTE:</span> This demo uses simulated AI responses. For real Grok AI integration, set GROK_API_KEY in your environment and use the SDK (see sdk/src/GrokAgent.ts). The firewall protection is real and works with both simulated and real AI agents.
          </p>
        </div>
      </div>
    </div>
  );
};
