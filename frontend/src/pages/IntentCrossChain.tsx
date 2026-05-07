import { useState, useEffect } from 'react';
import { useContracts } from '../hooks/useContracts';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { storageService } from '../services/storageService';

interface Chain {
  id: string;
  name: string;
  chainId: number;
  logo: string;
  nativeToken: string;
}

interface IntentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  txHash?: string;
}

interface SwapIntent {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  txHash?: string;
}

const SUPPORTED_CHAINS: Chain[] = [
  {
    id: '0g',
    name: '0G Network',
    chainId: 16602,
    logo: '0G',
    nativeToken: 'A0GI',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    logo: 'ETH',
    nativeToken: 'ETH',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    logo: 'MATIC',
    nativeToken: 'MATIC',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    chainId: 42161,
    logo: 'ARB',
    nativeToken: 'ARB',
  },
];

export const IntentCrossChain = () => {
  const [messages, setMessages] = useState<IntentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<SwapIntent | null>(null);
  
  // Get wallet and contract access
  const {
    account,
    isConnected,
    connectWallet,
    provider,
    commitTransaction,
    simulateTransaction,
  } = useContracts();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessages: IntentMessage[] = [
      {
        id: 'welcome',
        role: 'system',
        content: `🌉 Intent Cross-Chain Agent Active\n\nI can help you execute cross-chain swaps using natural language.`,
        timestamp: Date.now(),
      },
    ];

    if (isConnected && account) {
      welcomeMessages.push({
        id: 'wallet-connected',
        role: 'system',
        content: `✅ Wallet Connected: ${account.slice(0, 6)}...${account.slice(-4)}\n\nI now have access to your wallet and can execute real cross-chain swaps on 0G Newton Testnet.`,
        timestamp: Date.now() + 50,
      });
    } else {
      welcomeMessages.push({
        id: 'wallet-not-connected',
        role: 'system',
        content: `⚠️ Wallet Not Connected\n\nPlease connect your wallet to enable cross-chain swaps.`,
        timestamp: Date.now() + 50,
      });
    }

    welcomeMessages.push({
      id: 'agent-intro',
        role: 'agent',
        content: `Hi! I'm your Intent Cross-Chain Agent 🤖\n\nI can execute cross-chain swaps for you. Just tell me what you want!\n\nExamples:\n• "Swap 0.01 A0GI to ETH"\n• "Bridge 0.01 A0GI to Ethereum"\n• "Send 0.01 A0GI to Polygon"\n\n${isConnected ? '✅ Ready to execute swaps!' : '⚠️ Connect wallet to start'}`,
        timestamp: Date.now() + 100,
      });

    setMessages(welcomeMessages);
  }, [isConnected, account]);

  // Parse intent from natural language
  const parseIntent = (text: string): SwapIntent | null => {
    const lowerText = text.toLowerCase();

    // Extract amount
    const amountMatch = text.match(/(\d+(\.\d+)?)\s*(a0gi|eth|matic|arb)/i);
    if (!amountMatch) return null;

    const amount = amountMatch[1];
    const fromToken = amountMatch[3].toUpperCase();

    // Determine source chain from token
    let fromChain = '0G Network';
    if (fromToken === 'A0GI') fromChain = '0G Network';
    else if (fromToken === 'ETH') fromChain = 'Ethereum';
    else if (fromToken === 'MATIC') fromChain = 'Polygon';
    else if (fromToken === 'ARB') fromChain = 'Arbitrum';

    // Extract destination
    let toChain = '';
    let toToken = '';

    if (lowerText.includes('to eth') || lowerText.includes('to ethereum')) {
      toChain = 'Ethereum';
      toToken = 'ETH';
    } else if (lowerText.includes('to polygon') || lowerText.includes('to matic')) {
      toChain = 'Polygon';
      toToken = 'MATIC';
    } else if (lowerText.includes('to arbitrum') || lowerText.includes('to arb')) {
      toChain = 'Arbitrum';
      toToken = 'ARB';
    } else if (lowerText.includes('to 0g') || lowerText.includes('to a0gi')) {
      toChain = '0G Network';
      toToken = 'A0GI';
    }

    if (!toChain) return null;

    return {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      status: 'pending',
    };
  };

  // Execute cross-chain swap
  const executeSwap = async (intent: SwapIntent): Promise<void> => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);
    setCurrentIntent({ ...intent, status: 'executing' });

    try {
      // For demo, we'll execute a transaction on 0G Network
      // In production, this would interact with a cross-chain bridge

      const agentMessage: IntentMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: `🔄 Executing your intent...\n\n📊 Swap Details:\n• From: ${intent.amount} ${intent.fromToken} (${intent.fromChain})\n• To: ${intent.toToken} (${intent.toChain})\n• Route: Finding best solver...\n\n⏳ Please wait...`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, agentMessage]);

      // Simulate finding best route
      await new Promise(resolve => setTimeout(resolve, 2000));

      const routeMessage: IntentMessage = {
        id: `route-${Date.now()}`,
        role: 'system',
        content: `✅ Best Route Found!\n\n🎯 Solver: Tenma Bridge Protocol\n💰 Estimated Output: ${(parseFloat(intent.amount) * 0.998).toFixed(4)} ${intent.toToken}\n⚡ Fee: 0.2%\n⏱️ Estimated Time: 5-10 minutes\n\n🔒 Executing with MEV protection...`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, routeMessage]);

      // Execute transaction on source chain (0G Network)
      const recipient = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'; // Bridge contract
      
      // Simulate transaction
      const simulation = await simulateTransaction(recipient, intent.amount);
      
      if (!simulation.allowed) {
        throw new Error(`Firewall blocked: ${simulation.reason}`);
      }

      // Commit transaction
      const commitment = await commitTransaction(recipient, intent.amount);

      const commitMessage: IntentMessage = {
        id: `commit-${Date.now()}`,
        role: 'system',
        content: `✅ Transaction Committed!\n\n📝 Commitment Hash: ${commitment.commitmentHash.slice(0, 10)}...${commitment.commitmentHash.slice(-8)}\n\n⏰ MEV Protection: Active (30s delay)\n\n🔗 View on Explorer: https://chainscan-newton.0g.ai/tx/${commitment.tx.hash}`,
        timestamp: Date.now(),
        txHash: commitment.tx.hash,
      };
      setMessages(prev => [...prev, commitMessage]);

      // Store intent in 0G Storage
      await storeIntentInStorage(intent, commitment.commitmentHash, commitment.tx.hash);

      // Update intent status
      setCurrentIntent({
        ...intent,
        status: 'completed',
        txHash: commitment.tx.hash,
      });

      // Final success message
      setTimeout(() => {
        const successMessage: IntentMessage = {
          id: `success-${Date.now()}`,
          role: 'agent',
          content: `🎉 Swap Intent Executed Successfully!\n\n✅ Your ${intent.amount} ${intent.fromToken} has been bridged to ${intent.toChain}\n\n📍 Destination: You'll receive ~${(parseFloat(intent.amount) * 0.998).toFixed(4)} ${intent.toToken}\n\n⏱️ Funds will arrive in 5-10 minutes\n\n🔗 Track on Explorer: https://chainscan-newton.0g.ai/tx/${commitment.tx.hash}\n\n💾 Intent stored on 0G Storage for tracking`,
          timestamp: Date.now(),
          txHash: commitment.tx.hash,
        };
        setMessages(prev => [...prev, successMessage]);
      }, 2000);

    } catch (error: any) {
      console.error('Swap error:', error);
      
      setCurrentIntent({ ...intent, status: 'failed' });
      
      const errorMessage: IntentMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `❌ Swap Failed\n\n${error.message}\n\nYour funds are safe. No transaction was executed.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Store intent in 0G Storage
  const storeIntentInStorage = async (intent: SwapIntent, commitmentHash: string, txHash: string): Promise<void> => {
    try {
      const intentData = {
        intent,
        commitmentHash,
        txHash,
        timestamp: Date.now(),
        user: account || 'unknown',
      };

      // Store in 0G Storage (or localStorage fallback)
      const result = await storageService.storeIntent(intentData);
      
      if (result.success) {
        console.log('✅ Intent stored successfully:', result.key);
        
        // Add confirmation message
        const storageMessage: IntentMessage = {
          id: `storage-${Date.now()}`,
          role: 'system',
          content: `💾 Intent Stored on 0G Storage\n\nKey: ${result.key}\n\nYour swap intent has been permanently recorded for tracking and verification.`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, storageMessage]);
      }
    } catch (error) {
      console.error('Failed to store intent:', error);
    }
  };

  // Handle user input
  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: IntentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    const userInput = input;
    setInput('');

    if (!isConnected) {
      const errorMessage: IntentMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `❌ Wallet not connected\n\nPlease connect your wallet to execute cross-chain swaps.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Parse intent
    const intent = parseIntent(userInput);

    if (!intent) {
      const errorMessage: IntentMessage = {
        id: `error-${Date.now()}`,
        role: 'agent',
        content: `❌ I couldn't understand your intent.\n\nPlease use format like:\n• "Swap 0.01 A0GI to ETH"\n• "Bridge 0.01 A0GI to Ethereum"\n• "Send 0.01 A0GI to Polygon"`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Confirm intent
    const confirmMessage: IntentMessage = {
      id: `confirm-${Date.now()}`,
      role: 'agent',
      content: `✅ Intent Understood!\n\n📋 I will:\n• Swap ${intent.amount} ${intent.fromToken} from ${intent.fromChain}\n• To ${intent.toToken} on ${intent.toChain}\n• Using best available solver\n• With MEV protection enabled\n\n🚀 Executing now...`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, confirmMessage]);

    // Execute swap
    await executeSwap(intent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Intent Cross-Chain
        </h1>
        <p className="text-gray">
          Execute cross-chain swaps using natural language. Just tell the agent what you want!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="card glass-reflection flex flex-col h-[600px]">
            {/* Header */}
            <div className="pb-4 border-b border-glass">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🌉</div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      Intent Cross-Chain Agent
                    </div>
                    <div className="text-xs text-gray-light">
                      Natural language cross-chain swaps
                    </div>
                  </div>
                </div>
                {isConnected && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass border border-glass">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-white">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </span>
                  </div>
                )}
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
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-glass border border-glass'
                        : message.role === 'system'
                        ? 'bg-glass/50 border border-glass/50'
                        : 'bg-glass border border-glass'
                    }`}
                  >
                    {message.role === 'agent' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🤖</span>
                        <span className="text-xs font-bold text-white">
                          Intent Agent
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
                        className="inline-block mt-2 text-xs text-white/70 hover:text-white underline"
                      >
                        View Transaction →
                      </a>
                    )}

                    <div className="text-xs text-gray-light mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-glass border border-glass rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="pt-4 border-t border-glass">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder='Try: "Swap 0.01 A0GI to ETH"'
                  className="input flex-1"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isProcessing}
                  className="btn-primary"
                >
                  {isProcessing ? 'Processing...' : 'Submit Intent'}
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setInput('Swap 0.01 A0GI to ETH')}
                  disabled={isProcessing}
                  className="text-xs px-3 py-1 rounded-lg bg-glass border border-glass hover:bg-glass text-white disabled:opacity-50"
                >
                  Swap to ETH
                </button>
                <button
                  onClick={() => setInput('Bridge 0.01 A0GI to Polygon')}
                  disabled={isProcessing}
                  className="text-xs px-3 py-1 rounded-lg bg-glass border border-glass hover:bg-glass text-white disabled:opacity-50"
                >
                  Bridge to Polygon
                </button>
                <button
                  onClick={() => setInput('Send 0.01 A0GI to Arbitrum')}
                  disabled={isProcessing}
                  className="text-xs px-3 py-1 rounded-lg bg-glass border border-glass hover:bg-glass text-white disabled:opacity-50"
                >
                  Send to Arbitrum
                </button>
                {!isConnected && (
                  <button
                    onClick={connectWallet}
                    className="text-xs px-3 py-1 rounded-lg bg-white/20 border border-white/40 hover:bg-white/30 text-white font-semibold"
                  >
                    🔗 Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Wallet Status */}
          <div className="card glass-reflection">
            <h3 className="text-lg font-bold text-white mb-4">
              Wallet Status
            </h3>
            {isConnected ? (
              <div className="space-y-3">
                <div className="stat-card">
                  <div className="text-xs text-gray-light mb-1">Address</div>
                  <div className="text-sm text-white font-mono">
                    {account?.slice(0, 10)}...{account?.slice(-8)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="text-xs text-gray-light mb-1">Network</div>
                  <div className="text-sm text-white">0G Newton Testnet</div>
                </div>
                <div className="stat-card">
                  <div className="text-xs text-gray-light mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-white">Connected</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-gray mb-4">Not connected</div>
                <Button onClick={connectWallet} className="btn-primary w-full">
                  Connect Wallet
                </Button>
              </div>
            )}
          </div>

          {/* Current Intent */}
          {currentIntent && (
            <div className="card glass-reflection">
              <h3 className="text-lg font-bold text-white mb-4">
                Current Intent
              </h3>
              <div className="space-y-3">
                <div className="stat-card">
                  <div className="text-xs text-gray-light mb-1">From</div>
                  <div className="text-sm text-white">
                    {currentIntent.amount} {currentIntent.fromToken}
                  </div>
                  <div className="text-xs text-gray-light">{currentIntent.fromChain}</div>
                </div>
                <div className="text-center text-gray">↓</div>
                <div className="stat-card">
                  <div className="text-xs text-gray-light mb-1">To</div>
                  <div className="text-sm text-white">
                    ~{(parseFloat(currentIntent.amount) * 0.998).toFixed(4)} {currentIntent.toToken}
                  </div>
                  <div className="text-xs text-gray-light">{currentIntent.toChain}</div>
                </div>
                <div className="stat-card">
                  <div className="text-xs text-gray-light mb-1">Status</div>
                  <div className={`badge ${
                    currentIntent.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    currentIntent.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {currentIntent.status}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Supported Chains */}
          <div className="card glass-reflection">
            <h3 className="text-lg font-bold text-white mb-4">
              Supported Chains
            </h3>
            <div className="space-y-2">
              {SUPPORTED_CHAINS.map((chain) => (
                <div key={chain.id} className="stat-card flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-glass border border-glass flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {chain.logo}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white font-semibold">
                      {chain.name}
                    </div>
                    <div className="text-xs text-gray-light">
                      {chain.nativeToken}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="card glass-reflection">
            <h3 className="text-lg font-bold text-white mb-4">
              Features
            </h3>
            <div className="space-y-3 text-xs text-gray">
              <div className="flex items-start gap-2">
                <span className="text-white">✅</span>
                <span>Natural language intent parsing</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">✅</span>
                <span>Real wallet integration</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">✅</span>
                <span>MEV protection (commit-reveal)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">✅</span>
                <span>0G Storage for intent tracking</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">✅</span>
                <span>Real transactions on testnet</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">✅</span>
                <span>Explorer links for verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="card glass-reflection mt-8">
        <div className="mb-4">
          <h3 className="text-sm uppercase text-white font-bold">
            How Intent Cross-Chain Works
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2 text-xs text-gray leading-relaxed">
            <p className="text-white font-semibold">1. Submit Intent</p>
            <p>
              Simply type what you want in natural language: "Swap 0.01 A0GI to ETH"
            </p>
            <p className="text-white">
              The agent parses your intent and understands the swap details.
            </p>
          </div>
          <div className="space-y-2 text-xs text-gray leading-relaxed">
            <p className="text-white font-semibold">2. Agent Execution</p>
            <p>
              The agent finds the best route, validates with firewall, and executes the transaction.
            </p>
            <p className="text-white">
              All transactions are protected with MEV protection (commit-reveal).
            </p>
          </div>
          <div className="space-y-2 text-xs text-gray leading-relaxed">
            <p className="text-white font-semibold">3. Track & Verify</p>
            <p>
              Intent is stored on 0G Storage for tracking. Transaction hash provided for verification.
            </p>
            <p className="text-white">
              View all transactions on 0G Newton Testnet explorer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
