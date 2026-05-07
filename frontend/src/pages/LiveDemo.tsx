import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface AgentDecision {
  id: string;
  timestamp: number;
  action: 'buy' | 'sell' | 'hold' | 'wait';
  token: string;
  amount: string;
  reasoning: string;
  confidence: number;
  status: 'pending' | 'approved' | 'blocked';
  violations: PolicyViolation[];
}

interface PolicyViolation {
  rule: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
}

interface AgentStats {
  totalDecisions: number;
  approved: number;
  blocked: number;
  blockRate: number;
}

export const LiveDemo = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [stats, setStats] = useState<AgentStats>({
    totalDecisions: 0,
    approved: 0,
    blocked: 0,
    blockRate: 0,
  });
  const [currentBalance, setCurrentBalance] = useState('10.0');
  const intervalRef = useRef<NodeJS.Timeout>();

  // Simulate AI agent making decisions
  const simulateAgentDecision = () => {
    const scenarios = [
      // Scenario 1: Normal trade (APPROVED)
      {
        action: 'buy' as const,
        token: '0x1111111111111111111111111111111111111111',
        amount: '0.5',
        reasoning: 'Market conditions favorable, RSI indicates oversold, good entry point for DCA strategy',
        confidence: 0.85,
        violations: [],
        status: 'approved' as const,
      },
      // Scenario 2: Exceeds limit (BLOCKED)
      {
        action: 'buy' as const,
        token: '0x2222222222222222222222222222222222222222',
        amount: '15.0',
        reasoning: 'Strong bullish signal detected, attempting large position to maximize gains',
        confidence: 0.92,
        violations: [
          {
            rule: 'MAX_TRANSACTION_AMOUNT',
            message: 'Transaction amount 15.0 A0GI exceeds maximum allowed 10.0 A0GI',
            severity: 'critical' as const,
            blocked: true,
          },
        ],
        status: 'blocked' as const,
      },
      // Scenario 3: Blacklisted contract (BLOCKED)
      {
        action: 'sell' as const,
        token: '0x3333333333333333333333333333333333333333',
        amount: '2.0',
        reasoning: 'High yield opportunity detected on suspicious protocol, attempting arbitrage',
        confidence: 0.78,
        violations: [
          {
            rule: 'BLACKLISTED_CONTRACT',
            message: 'Recipient 0x3333333333333333333333333333333333333333 is blacklisted (known scam)',
            severity: 'critical' as const,
            blocked: true,
          },
        ],
        status: 'blocked' as const,
      },
      // Scenario 4: Not whitelisted (BLOCKED)
      {
        action: 'buy' as const,
        token: '0x4444444444444444444444444444444444444444',
        amount: '3.0',
        reasoning: 'New DeFi protocol with high APY, attempting to enter early',
        confidence: 0.65,
        violations: [
          {
            rule: 'NOT_WHITELISTED',
            message: 'Recipient 0x4444444444444444444444444444444444444444 is not in whitelist',
            severity: 'high' as const,
            blocked: true,
          },
        ],
        status: 'blocked' as const,
      },
      // Scenario 5: Small safe trade (APPROVED)
      {
        action: 'buy' as const,
        token: '0x5555555555555555555555555555555555555555',
        amount: '0.1',
        reasoning: 'Conservative DCA entry, low risk, whitelisted DEX',
        confidence: 0.72,
        violations: [],
        status: 'approved' as const,
      },
      // Scenario 6: Daily limit exceeded (BLOCKED)
      {
        action: 'buy' as const,
        token: '0x6666666666666666666666666666666666666666',
        amount: '8.0',
        reasoning: 'Major opportunity detected, attempting large trade',
        confidence: 0.88,
        violations: [
          {
            rule: 'DAILY_LIMIT_EXCEEDED',
            message: 'Daily spending limit of 50.0 A0GI would be exceeded',
            severity: 'critical' as const,
            blocked: true,
          },
        ],
        status: 'blocked' as const,
      },
    ];

    // Pick random scenario
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    const decision: AgentDecision = {
      id: `decision-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      ...scenario,
    };

    // Add decision to list
    setDecisions(prev => [decision, ...prev].slice(0, 20)); // Keep last 20

    // Update stats
    setStats(prev => {
      const newTotal = prev.totalDecisions + 1;
      const newApproved = prev.approved + (decision.status === 'approved' ? 1 : 0);
      const newBlocked = prev.blocked + (decision.status === 'blocked' ? 1 : 0);
      
      return {
        totalDecisions: newTotal,
        approved: newApproved,
        blocked: newBlocked,
        blockRate: newBlocked / newTotal,
      };
    });

    // Update balance if approved
    if (decision.status === 'approved') {
      setCurrentBalance(prev => {
        const current = parseFloat(prev);
        const amount = parseFloat(decision.amount);
        return (current - amount).toFixed(2);
      });
    }
  };

  const startDemo = () => {
    setIsRunning(true);
    
    // Make decision every 3 seconds
    intervalRef.current = setInterval(() => {
      simulateAgentDecision();
    }, 3000);

    // Make first decision immediately
    simulateAgentDecision();
  };

  const stopDemo = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetDemo = () => {
    stopDemo();
    setDecisions([]);
    setStats({
      totalDecisions: 0,
      approved: 0,
      blocked: 0,
      blockRate: 0,
    });
    setCurrentBalance('10.0');
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Live AI Agent Demo
        </h1>
        <p className="text-gray">
          Watch a Grok-powered AI agent make trading decisions in real-time. 
          The Tenma Firewall blocks risky transactions before they execute on 0G Network.
        </p>
      </div>

      {/* Controls */}
      <div className="card glass-reflection mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Agent Control</h3>
            <p className="text-sm text-gray">
              {isRunning ? 'Agent is making decisions every 3 seconds' : 'Agent is stopped'}
            </p>
          </div>
          <div className="flex gap-3">
            {!isRunning ? (
              <Button onClick={startDemo} className="btn-primary">
                Start Agent
              </Button>
            ) : (
              <Button onClick={stopDemo} className="btn-secondary">
                Stop Agent
              </Button>
            )}
            <Button onClick={resetDemo} className="btn-secondary">
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="stat-card glass-reflection">
          <div className="text-xs text-gray-light mb-2 font-semibold tracking-wider">BALANCE</div>
          <div className="text-3xl font-bold text-white">{currentBalance} A0GI</div>
        </div>
        
        <div className="stat-card glass-reflection">
          <div className="text-xs text-gray-light mb-2 font-semibold tracking-wider">TOTAL DECISIONS</div>
          <div className="text-3xl font-bold text-white">{stats.totalDecisions}</div>
        </div>
        
        <div className="stat-card glass-reflection">
          <div className="text-xs text-gray-light mb-2 font-semibold tracking-wider">APPROVED</div>
          <div className="text-3xl font-bold text-white">{stats.approved}</div>
        </div>
        
        <div className="stat-card glass-reflection">
          <div className="text-xs text-gray-light mb-2 font-semibold tracking-wider">BLOCKED</div>
          <div className="text-3xl font-bold text-white">{stats.blocked}</div>
        </div>
        
        <div className="stat-card glass-reflection">
          <div className="text-xs text-gray-light mb-2 font-semibold tracking-wider">BLOCK RATE</div>
          <div className="text-3xl font-bold text-white">
            {(stats.blockRate * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Decision Feed */}
      <div className="card glass-reflection">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-1">Decision Feed</h3>
          <p className="text-sm text-gray">
            Real-time AI agent decisions and firewall enforcement
          </p>
        </div>

        {decisions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray mb-4">No decisions yet</div>
            <p className="text-sm text-gray-light">
              Click "Start Agent" to begin the demo
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className={`p-4 rounded-lg border transition-all ${
                  decision.status === 'approved'
                    ? 'bg-glass border-glass'
                    : 'bg-glass border-white/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      decision.status === 'approved' 
                        ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' 
                        : 'bg-white/50'
                    }`} />
                    <div>
                      <div className="text-sm font-bold text-white uppercase">
                        {decision.action} {decision.amount} A0GI
                      </div>
                      <div className="text-xs text-gray-light">
                        {new Date(decision.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`badge ${
                    decision.status === 'approved' 
                      ? 'bg-glass border-glass' 
                      : 'bg-white/10 border-white/30'
                  }`}>
                    {decision.status === 'approved' ? 'APPROVED' : 'BLOCKED'}
                  </div>
                </div>

                {/* Reasoning */}
                <div className="mb-3">
                  <div className="text-xs text-gray-light mb-1 uppercase tracking-wider">
                    AI Reasoning
                  </div>
                  <div className="text-sm text-gray">
                    {decision.reasoning}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-light mb-1">Token</div>
                    <div className="text-xs text-white font-mono">
                      {decision.token.slice(0, 10)}...{decision.token.slice(-8)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-light mb-1">Confidence</div>
                    <div className="text-xs text-white">
                      {(decision.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Violations */}
                {decision.violations.length > 0 && (
                  <div className="pt-3 border-t border-glass">
                    <div className="text-xs text-gray-light mb-2 uppercase tracking-wider">
                      Firewall Violations
                    </div>
                    <div className="space-y-2">
                      {decision.violations.map((violation, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs"
                        >
                          <span className="text-white">✗</span>
                          <div className="flex-1">
                            <div className="text-white font-semibold mb-1">
                              {violation.rule.replace(/_/g, ' ')}
                            </div>
                            <div className="text-gray-light">
                              {violation.message}
                            </div>
                          </div>
                          <span className={`badge text-xs ${
                            violation.severity === 'critical' 
                              ? 'bg-white/20 border-white/40' 
                              : 'bg-white/10 border-white/20'
                          }`}>
                            {violation.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="card glass-reflection mt-8">
        <div className="mb-4">
          <h3 className="text-sm uppercase text-white font-bold">
            How It Works
          </h3>
        </div>
        <div className="space-y-2 text-xs text-gray leading-relaxed">
          <p>
            <span className="text-white">1. AI Agent Decision:</span> Grok AI analyzes market conditions and makes trading decisions autonomously
          </p>
          <p>
            <span className="text-white">2. Firewall Validation:</span> Before execution, the Tenma Firewall validates the transaction against on-chain policies
          </p>
          <p>
            <span className="text-white">3. Real-Time Blocking:</span> If any policy is violated, the transaction is blocked BEFORE it reaches the blockchain
          </p>
          <p>
            <span className="text-white">4. On-Chain Enforcement:</span> Approved transactions are committed to 0G Network with MEV protection
          </p>
          <p className="pt-2 border-t border-glass">
            <span className="text-white">KEY ADVANTAGE:</span> The firewall blocks bad transactions at the smart contract level - even if the AI agent is compromised or manipulated, funds cannot be drained beyond configured limits.
          </p>
          <p className="pt-2 border-t border-glass">
            <span className="text-white">DEMO MODE:</span> This demo simulates AI agent decisions. For real Grok AI integration, set GROK_API_KEY and use the SDK (see sdk/src/GrokAgent.ts). The firewall logic shown here matches the real smart contract enforcement on 0G Network.
          </p>
        </div>
      </div>
    </div>
  );
};
