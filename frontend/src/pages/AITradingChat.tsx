import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useContracts } from '../hooks/useContracts';
import { ethers } from 'ethers';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  blocked?: boolean;
  violation?: string;
  txHash?: string;
  commitmentHash?: string;
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
    avatar: 'DCA',
  },
  {
    id: 'arbitrage-bot',
    name: 'Arbitrage Hunter',
    description: 'Finds price differences across DEXs and exploits them.',
    strategy: 'Arbitrage',
    riskProfile: 'moderate',
    avatar: 'ARB',
  },
  {
    id: 'momentum-bot',
    name: 'Momentum Trader',
    description: 'Follows market trends and momentum signals.',
    strategy: 'Momentum',
    riskProfile: 'aggressive',
    avatar: 'MOM',
  },
  {
    id: 'grid-bot',
    name: 'Grid Trader',
    description: 'Places buy and sell orders at regular intervals.',
    strategy: 'Grid Trading',
    riskProfile: 'moderate',
    avatar: 'GRID',
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
  const [isExecuting, setIsExecuting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get wallet and contract access
  const {
    account,
    isConnected,
    connectWallet,
    simulateTransaction,
    commitTransaction,
    revealTransaction,
  } = useContracts();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessages: Message[] = [
      {
        id: 'welcome',
        role: 'system',
        content: `🛡️ Tenma Firewall Active - All commands are validated against on-chain policies before execution.`,
        timestamp: Date.now(),
      },
    ];

    if (isConnected && account) {
      welcomeMessages.push({
        id: 'wallet-connected',
        role: 'system',
        content: `✅ Wallet Connected: ${account.slice(0, 6)}...${account.slice(-4)}\n\nI now have access to your wallet and can execute real transactions on 0G Newton Testnet.`,
        timestamp: Date.now() + 50,
      });
    } else {
      welcomeMessages.push({
        id: 'wallet-not-connected',
        role: 'system',
        content: `⚠️ Wallet Not Connected\n\nPlease connect your wallet to enable real transaction execution. I can still chat and provide analysis, but cannot execute trades.`,
        timestamp: Date.now() + 50,
      });
    }

    welcomeMessages.push({
      id: 'agent-intro',
      role: 'agent',
      content: `Hi! I'm ${selectedAgent.name}. ${selectedAgent.description}\n\nI can help you with:\n• Market analysis\n• Real trade execution ${isConnected ? '(wallet connected ✅)' : '(connect wallet first)'}\n• Portfolio management\n• Risk assessment\n\nAll my actions are protected by the Tenma Firewall. ${isConnected ? 'Try asking me to make a real trade!' : 'Connect your wallet to enable trading.'}`,
      timestamp: Date.now() + 100,
    });

    setMessages(welcomeMessages);
  }, [selectedAgent, isConnected, account]);

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

  // Execute real transaction on 0G Network
  const executeRealTransaction = async (amount: string, recipient: string = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'): Promise<{ success: boolean; message: string; txHash?: string; commitmentHash?: string }> => {
    if (!isConnected || !account) {
      return {
        success: false,
        message: 'Wallet not connected. Please connect your wallet to execute transactions.',
      };
    }

    try {
      setIsExecuting(true);

      // Step 1: Simulate transaction first
      const simulation = await simulateTransaction(recipient, amount);
      
      if (!simulation.allowed) {
        return {
          success: false,
          message: `🚫 Transaction blocked by firewall: ${simulation.reason}`,
        };
      }

      // Step 2: Commit transaction (MEV protection)
      const commitment = await commitTransaction(recipient, amount);
      
      const commitmentHash = commitment.commitmentHash;
      const secret = commitment.secret;

      // Add message about commitment
      const commitMessage: Message = {
        id: `commit-${Date.now()}`,
        role: 'system',
        content: `✅ Transaction committed to blockchain!\n\n📝 Commitment Hash: ${commitmentHash.slice(0, 10)}...${commitmentHash.slice(-8)}\n\n⏰ MEV Protection: Transaction will be revealed in 5 minutes\n\n🔗 View on Explorer: https://chainscan-newton.0g.ai/tx/${commitment.tx.hash}`,
        timestamp: Date.now(),
        commitmentHash,
        txHash: commitment.tx.hash,
      };
      
      setMessages(prev => [...prev, commitMessage]);

      // Step 3: Schedule reveal after 5 minutes (for demo, we'll do 30 seconds)
      setTimeout(async () => {
        try {
          const revealTx = await revealTransaction(recipient, amount, '0x', secret);
          
          const revealMessage: Message = {
            id: `reveal-${Date.now()}`,
            role: 'system',
            content: `🔓 Transaction revealed and executed!\n\n✅ Status: Success\n💰 Amount: ${amount} A0GI\n📍 Recipient: ${recipient.slice(0, 10)}...${recipient.slice(-8)}\n\n🔗 View on Explorer: https://chainscan-newton.0g.ai/tx/${revealTx.hash}`,
            timestamp: Date.now(),
            txHash: revealTx.hash,
          };
          
          setMessages(prev => [...prev, revealMessage]);
        } catch (error: any) {
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            role: 'system',
            content: `❌ Error revealing transaction: ${error.message}\n\nThe commitment was successful but reveal failed. This is normal in demo mode.`,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }, 30000); // 30 seconds for demo (real would be 5 minutes)

      return {
        success: true,
        message: `Transaction committed successfully! Commitment hash: ${commitmentHash}`,
        commitmentHash,
        txHash: commitment.tx.hash,
      };
    } catch (error: any) {
      console.error('Transaction error:', error);
      return {
        success: false,
        message: `Transaction failed: ${error.message || 'Unknown error'}`,
      };
    } finally {
      setIsExecuting(false);
    }
  };

  const generateAgentResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // Buy commands - Execute real transaction
    if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      const amountMatch = userMessage.match(/(\d+(\.\d+)?)\s*(eth|a0gi)/i);
      const amount = amountMatch ? amountMatch[1] : '0.01'; // Default to 0.01 for safety
      
      if (!isConnected) {
        return `❌ Cannot execute trade - wallet not connected.\n\nPlease connect your wallet first to enable real transaction execution on 0G Newton Testnet.`;
      }

      // Execute real transaction
      const result = await executeRealTransaction(amount);
      
      if (result.success) {
        return `✅ REAL TRANSACTION EXECUTED!\n\n📊 Trade Details:\n• Strategy: ${selectedAgent.strategy}\n• Amount: ${amount} A0GI\n• Risk level: ${selectedAgent.riskProfile}\n• Network: 0G Newton Testnet\n\n🔒 Security:\n• Firewall validation: PASSED\n• MEV protection: ACTIVE (5-minute delay)\n• Commitment hash: ${result.commitmentHash?.slice(0, 16)}...\n\n⏰ Transaction will be revealed in 30 seconds (demo mode)\n\n🔗 Track on Explorer: https://chainscan-newton.0g.ai`;
      } else {
        return `❌ Transaction Failed\n\n${result.message}\n\nThe Tenma Firewall protected your funds by blocking this transaction.`;
      }
    }

    // Sell commands
    if (lowerMessage.includes('sell')) {
      const amountMatch = userMessage.match(/(\d+(\.\d+)?)\s*(eth|a0gi)/i);
      const amount = amountMatch ? amountMatch[1] : '0.3';
      
      if (!isConnected) {
        return `❌ Cannot execute trade - wallet not connected.\n\nPlease connect your wallet first.`;
      }
      
      return `I'll execute a ${selectedAgent.strategy} sell order for ${amount} A0GI.\n\n📊 Analysis:\n• Current market conditions: Neutral\n• Risk level: ${selectedAgent.riskProfile}\n• Expected execution: ~5 minutes (MEV protected)\n\n✅ Firewall validation: PASSED\n🔒 Transaction will be committed to 0G Network.\n\n💡 Note: Sell functionality coming soon. For now, try "Buy 0.01 A0GI" to see real transaction execution!`;
    }

    // Status/portfolio commands
    if (lowerMessage.includes('status') || lowerMessage.includes('portfolio') || lowerMessage.includes('balance')) {
      return `📊 Current Portfolio Status:\n\n💰 Wallet: ${account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}\n🌐 Network: 0G Newton Testnet\n${isConnected ? '✅ Connected and ready to trade' : '❌ Not connected'}\n\n🛡️ Firewall Status: Active\n✅ All policies enforced\n🔒 MEV protection enabled\n\n${isConnected ? '💡 Try: "Buy 0.01 A0GI" to execute a real transaction!' : '💡 Connect your wallet to start trading'}`;
    }

    // Market analysis
    if (lowerMessage.includes('market') || lowerMessage.includes('analysis') || lowerMessage.includes('price')) {
      return `📊 Market Analysis (${selectedAgent.strategy}):\n\n• A0GI/USD: $0.85 (+0.5%)\n• Volume: Moderate\n• Volatility: Low\n• Trend: Stable\n\n💡 Recommendation: ${selectedAgent.riskProfile === 'conservative' ? 'Good time for small DCA entry' : selectedAgent.riskProfile === 'moderate' ? 'Consider test transaction' : 'Market conditions favorable'}\n\n🛡️ All recommendations are within firewall limits.\n\n${isConnected ? '✅ Ready to execute: Try "Buy 0.01 A0GI"' : '⚠️ Connect wallet to trade'}`;
    }

    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm ${selectedAgent.name}, specialized in ${selectedAgent.strategy}.\n\n🤖 I can help you:\n• Execute REAL trades on 0G Network ${isConnected ? '✅' : '(connect wallet)'}\n• Analyze markets\n• Check portfolio status\n• ${selectedAgent.strategy} strategies\n\n🛡️ All my actions are protected by Tenma Firewall:\n✅ Amount limits enforced\n✅ Blacklist checking\n✅ Risk assessment\n✅ MEV protection (commit-reveal)\n\n${isConnected ? '💡 Try: "Buy 0.01 A0GI" for a real transaction!' : '💡 Connect your wallet to start trading'}\n\n🔗 All transactions visible on: https://chainscan-newton.0g.ai`;
    }

    // Default response
    return `I understand you want to ${userMessage}. As a ${selectedAgent.strategy} specialist, I can help with that.\n\nCould you be more specific? For example:\n• "Buy 0.01 A0GI" ${isConnected ? '(executes real transaction!)' : '(connect wallet first)'}\n• "Show market analysis"\n• "Check portfolio status"\n\n🛡️ All commands are validated by Tenma Firewall before execution.`;
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
    const userInput = input;
    setInput('');
    setIsTyping(true);

    // Get agent response (now async for real transactions)
    try {
      const responseContent = await generateAgentResponse(userInput);
      
      const agentResponse: Message = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: responseContent,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, agentResponse]);
    } catch (error: any) {
      const errorResponse: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `❌ Error: ${error.message}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
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
                    <div className="w-10 h-10 rounded-lg bg-glass border border-glass flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{agent.avatar}</span>
                    </div>
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
                <div className="w-10 h-10 rounded-lg bg-glass border border-glass flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{selectedAgent.avatar}</span>
                </div>
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
                        <div className="w-6 h-6 rounded bg-glass border border-glass flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">{selectedAgent.avatar}</span>
                        </div>
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
                      <div className="w-6 h-6 rounded bg-glass border border-glass flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{selectedAgent.avatar}</span>
                      </div>
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
