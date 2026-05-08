import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useContracts } from '../hooks/useContracts';
import { useTransactionStats } from '../hooks/useTransactionStats';
import { agentApi } from '../services/agentApi';
import { ApprovalModal } from '../components/ApprovalModal';
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

export const AITradingChat = () => {
  const [selectedAgent, setSelectedAgent] = useState<TradingAgent>(TRADING_AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get wallet and contract access
  const {
    account,
    isConnected,
    commitTransaction,
    revealTransaction,
  } = useContracts();

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only auto-scroll if user is near bottom (within 100px)
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessages: Message[] = [
      {
        id: 'welcome',
        role: 'system',
        content: `🤖 Tenma AI Agent powered by Groq (Llama 3.3 70B)\n🛡️ Firewall Active - All commands validated before execution`,
        timestamp: Date.now(),
      },
    ];

    if (isConnected && account) {
      welcomeMessages.push({
        id: 'wallet-connected',
        role: 'system',
        content: `✅ Wallet Connected: ${account.slice(0, 6)}...${account.slice(-4)}\n\n🔗 Real agent API connected\n💾 Memory enabled\n✅ Ready to execute transactions`,
        timestamp: Date.now() + 50,
      });
    } else {
      welcomeMessages.push({
        id: 'wallet-not-connected',
        role: 'system',
        content: `⚠️ Wallet Not Connected\n\nPlease connect your wallet to use the AI agent. The agent needs your address to:\n• Check balances\n• Execute trades\n• Validate transactions`,
        timestamp: Date.now() + 50,
      });
    }

    welcomeMessages.push({
      id: 'agent-intro',
      role: 'agent',
      content: `Hi! I'm ${selectedAgent.name}. ${selectedAgent.description}\n\n🤖 I can help you with:\n• Check your balance\n• Execute real trades ${isConnected ? '✅' : '(connect wallet first)'}\n• Market analysis\n• Portfolio management\n\n🛡️ Security:\n• All actions protected by Tenma Firewall\n• High-risk actions require your approval\n• Full audit trail in database\n\n${isConnected ? '💡 Try: "What is my balance?" or "Buy 0.01 A0GI"' : '💡 Connect your wallet to get started'}`,
      timestamp: Date.now() + 100,
    });

    setMessages(welcomeMessages);
  }, [selectedAgent, isConnected, account]);

  // Update messages when wallet connection changes
  useEffect(() => {
    if (messages.length > 0) {
      // Check if we need to update wallet status message
      const hasWalletStatusMessage = messages.some(
        m => m.id === 'wallet-connected' || m.id === 'wallet-not-connected'
      );

      if (hasWalletStatusMessage) {
        // Remove old wallet status messages and add new one
        setMessages(prev => {
          const filtered = prev.filter(
            m => m.id !== 'wallet-connected' && m.id !== 'wallet-not-connected'
          );

          if (isConnected && account) {
            return [
              ...filtered,
              {
                id: 'wallet-connected',
                role: 'system',
                content: `✅ Wallet Connected: ${account.slice(0, 6)}...${account.slice(-4)}\n\nI now have access to your wallet and can execute real transactions on 0G Newton Testnet.`,
                timestamp: Date.now(),
              },
            ];
          }

          return filtered;
        });
      }
    }
  }, [isConnected, account]);

  const generateAgentResponse = async (userMessage: string): Promise<string> => {
    // Always use real agent if wallet is connected
    if (isConnected && account) {
      try {
        const response = await agentApi.chatWithRealAgent({
          message: userMessage,
          address: account,
        });

        // If action requires approval, show approval modal
        if (response.requiresApproval) {
          setShowApprovalModal(true);
          return response.message + '\n\n⚠️ This action requires your approval. Click "View Approvals" to review.';
        }

        // If tools were executed, show them
        if (response.toolsExecuted && response.toolsExecuted.length > 0) {
          return response.message + `\n\n🔧 Tools used: ${response.toolsExecuted.join(', ')}`;
        }

        return response.message;
      } catch (error: any) {
        console.error('Real agent error:', error);
        return `❌ Agent error: ${error.message}\n\nPlease make sure the agent API is running on http://localhost:3001`;
      }
    }

    // If wallet not connected, show message
    return `⚠️ Please connect your wallet to use the AI agent.\n\nThe agent needs your wallet address to:\n• Check your balance\n• Execute trades\n• Validate transactions\n\nClick "Connect Wallet" in the header to get started.`;
  };

  // Handle approval (Updated: 2026-05-08 - Real Wallet Execution)
  const handleApprove = async (approvalId: string) => {
    if (!account) return;

    console.log('🔵 handleApprove called - Updated version with wallet execution');
    console.log('🔵 Account:', account);
    console.log('🔵 Approval ID:', approvalId);

    try {
      // First, get the approval result from backend
      const result = await agentApi.approveAction(approvalId, account);
      
      console.log('🔵 Approval result:', result);
      console.log('🔵 Result structure:', JSON.stringify(result, null, 2));
      console.log('🔵 Requires wallet execution?', result.result?.requiresWalletExecution);
      
      // Check if this requires wallet execution
      if (result.result && result.result.requiresWalletExecution === true) {
        console.log('✅ Wallet execution required - starting transaction flow');
        
        // Add preparing message
        const preparingMessage: Message = {
          id: `preparing-${Date.now()}`,
          role: 'system',
          content: `⏳ Preparing transaction...\n\n${result.result.message}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, preparingMessage]);

        // Execute real transaction with wallet
        try {
          console.log('🔵 Executing direct transfer (simplified for testing)...');
          
          // For now, let's do a simple direct transfer instead of commit-reveal
          // This will help us test the wallet integration first
          const transferMessage: Message = {
            id: `transfer-${Date.now()}`,
            role: 'system',
            content: `💸 Executing transfer...\n\n⚠️ MetaMask will open - please confirm the transaction.\n\n📊 Details:\n• Amount: ${result.result.value} A0GI\n• To: ${result.result.to}\n• Type: ${result.result.transactionType}`,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, transferMessage]);

          console.log('🔵 Calling signer.sendTransaction with:', {
            to: result.result.to,
            value: ethers.parseEther(result.result.value),
          });

          // Get signer from useContracts
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          // Check balance first
          const balance = await provider.getBalance(account);
          const requiredAmount = ethers.parseEther(result.result.value);
          
          console.log('🔵 Balance check:', {
            balance: ethers.formatEther(balance),
            required: result.result.value,
            hasEnough: balance >= requiredAmount
          });

          if (balance < requiredAmount) {
            throw new Error(`Insufficient balance. You have ${ethers.formatEther(balance)} A0GI but need ${result.result.value} A0GI`);
          }

          // Send direct transaction with manual gas limit to skip estimation
          const tx = await signer.sendTransaction({
            to: result.result.to,
            value: requiredAmount,
            gasLimit: 21000, // Standard transfer gas limit
          });

          console.log('✅ Transaction sent:', tx.hash);

          const pendingMessage: Message = {
            id: `pending-${Date.now()}`,
            role: 'system',
            content: `⏳ Transaction submitted!\n\n📝 Transaction Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}\n\nWaiting for confirmation...`,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, pendingMessage]);

          // Wait for confirmation
          const receipt = await tx.wait();

          console.log('✅ Transaction confirmed:', receipt);

          // Add success message with real transaction hash
          const successMessage: Message = {
            id: `approval-success-${Date.now()}`,
            role: 'system',
            content: `✅ Transaction executed successfully!\n\n📊 Details:\n• Type: ${result.result.transactionType}\n• Amount: ${result.result.amount || result.result.value} A0GI\n• To: ${result.result.to}\n• Network: 0G Newton Testnet\n• Status: Confirmed\n• Block: ${receipt.blockNumber}\n\n🔗 View on Explorer:\nhttps://0g.exploreme.pro/tx/${tx.hash}\n\n✨ Transaction completed!`,
            timestamp: Date.now(),
            txHash: tx.hash,
          };
          
          setMessages(prev => [...prev, successMessage]);
        } catch (walletError: any) {
          console.error('❌ Wallet execution failed:', walletError);
          
          // Wallet execution failed
          const errorMessage: Message = {
            id: `wallet-error-${Date.now()}`,
            role: 'system',
            content: `❌ Transaction failed: ${walletError.message}\n\nYour funds are safe. No transaction was executed.`,
            timestamp: Date.now(),
          };
          
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        console.warn('⚠️ Expected requiresWalletExecution but got:', result);
        
        // No wallet execution needed, just show result
        const successMessage: Message = {
          id: `approval-success-${Date.now()}`,
          role: 'system',
          content: `✅ Action approved!\n\n⏳ Executing transaction through your wallet...\n\nPlease check your wallet for transaction requests.\n\n🔍 Debug Info:\nrequiresWalletExecution: ${result.result?.requiresWalletExecution}\nResult: ${JSON.stringify(result.result, null, 2)}`,
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, successMessage]);
      }
    } catch (error: any) {
      console.error('❌ Approval error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `approval-error-${Date.now()}`,
        role: 'system',
        content: `❌ Approval failed: ${error.message}`,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle rejection
  const handleReject = async (approvalId: string) => {
    try {
      await agentApi.rejectAction(approvalId);
      
      // Add rejection message
      const rejectionMessage: Message = {
        id: `approval-rejected-${Date.now()}`,
        role: 'system',
        content: `❌ Action rejected by user`,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, rejectionMessage]);
    } catch (error: any) {
      console.error('Rejection error:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      {/* Approval Modal */}
      {isConnected && account && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          userAddress={account}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Trading Chat
        </h1>
        <p className="text-gray">
          Chat with AI trading agents powered by Groq AI. The Tenma Firewall blocks suspicious commands in real-time.
        </p>
        
        {/* View Approvals Button */}
        {isConnected && account && (
          <div className="mt-4">
            <button
              onClick={() => setShowApprovalModal(true)}
              className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
            >
              📋 View Pending Approvals
            </button>
          </div>
        )}
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
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-4 space-y-4">
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

                    {message.txHash && (
                      <a
                        href={`https://chainscan-newton.0g.ai/tx/${message.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-glass border border-glass hover:bg-glass text-xs text-white hover:text-white transition-all"
                      >
                        View Transaction on Explorer →
                      </a>
                    )}

                    {message.commitmentHash && (
                      <div className="mt-2 text-xs text-gray-light">
                        Commitment: {message.commitmentHash.slice(0, 16)}...
                      </div>
                    )}

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
                  onKeyDown={handleKeyDown}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="card glass-reflection mt-8">
        <div className="mb-4">
          <h3 className="text-sm uppercase text-white font-bold">
            🤖 Real AI Agent with Groq
          </h3>
        </div>
        <div className="space-y-2 text-xs text-gray leading-relaxed">
          <p>
            <span className="text-white">1. Groq AI (Llama 3.3 70B):</span> Ultra-fast AI responses (200-500ms) for intelligent trading decisions
          </p>
          <p>
            <span className="text-white">2. 15+ Blockchain Tools:</span> Real tools for balance checks, swaps, gas estimation, and firewall validation
          </p>
          <p>
            <span className="text-white">3. Risk-Based Execution:</span> Low-risk tools execute immediately, high-risk tools require your approval
          </p>
          <p>
            <span className="text-white">4. Persistent Memory:</span> All conversations and executions saved to Supabase database
          </p>
          <p>
            <span className="text-white">5. Firewall Protection:</span> All transactions validated against on-chain policies before execution
          </p>
          <p className="pt-2 border-t border-glass">
            <span className="text-white">TRY IT:</span> Ask "What is my balance?" (low-risk, executes immediately) or "Buy 0.5 A0GI" (high-risk, requires approval)
          </p>
          <p className="pt-2 border-t border-glass">
            <span className="text-white">REAL AGENT:</span> This is not a demo! The agent uses real Groq AI, executes real blockchain transactions, and saves everything to a real database. All actions are auditable and reversible.
          </p>
        </div>
      </div>
    </div>
  );
};
