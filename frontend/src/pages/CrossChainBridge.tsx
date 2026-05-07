import { useState } from 'react'

interface Chain {
  id: string
  name: string
  chainId: number
  logo: string
  balance: string
  nativeToken: string
}

interface BridgeTransaction {
  id: number
  fromChain: string
  toChain: string
  amount: string
  token: string
  status: 'Pending' | 'Completed' | 'Failed'
  timestamp: string
}

export const CrossChainBridge = () => {
  const [chains] = useState<Chain[]>([
    {
      id: '0g',
      name: '0G Network',
      chainId: 16602,
      logo: '0G',
      balance: '12.45',
      nativeToken: 'A0GI',
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      chainId: 1,
      logo: 'ETH',
      balance: '2.34',
      nativeToken: 'ETH',
    },
    {
      id: 'polygon',
      name: 'Polygon',
      chainId: 137,
      logo: 'MATIC',
      balance: '156.78',
      nativeToken: 'MATIC',
    },
    {
      id: 'arbitrum',
      name: 'Arbitrum',
      chainId: 42161,
      logo: 'ARB',
      balance: '8.92',
      nativeToken: 'ARB',
    },
  ])

  const [fromChain, setFromChain] = useState<Chain>(chains[0])
  const [toChain, setToChain] = useState<Chain>(chains[1])
  const [amount, setAmount] = useState('')

  const [recentTransactions] = useState<BridgeTransaction[]>([
    {
      id: 1,
      fromChain: '0G Network',
      toChain: 'Ethereum',
      amount: '5.0',
      token: 'A0GI',
      status: 'Completed',
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      fromChain: 'Polygon',
      toChain: '0G Network',
      amount: '100.0',
      token: 'MATIC',
      status: 'Completed',
      timestamp: '5 hours ago',
    },
    {
      id: 3,
      fromChain: 'Arbitrum',
      toChain: '0G Network',
      amount: '2.5',
      token: 'ETH',
      status: 'Pending',
      timestamp: '10 min ago',
    },
  ])

  const handleSwapChains = () => {
    const temp = fromChain
    setFromChain(toChain)
    setToChain(temp)
  }

  const handleBridge = () => {
    console.log('Bridging', amount, 'from', fromChain.name, 'to', toChain.name)
    // Bridge logic here
  }

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Intent Cross-Chain
          </h1>
          <p className="text-xl text-gray">
            Seamless multi-chain operations with intent-based execution and unified policy enforcement
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Bridge Interface */}
          <div className="col-span-2">
            <div className="card mb-6">
              <h3 className="text-2xl font-bold text-white mb-6">
                Intent-Based Transfer
              </h3>

              <div className="mb-6 p-4 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <div className="text-sm text-white/80 mb-2">
                  💡 <span className="font-semibold">What is Intent-Based?</span>
                </div>
                <div className="text-xs text-white/60">
                  Simply specify what you want to achieve. Solvers compete to execute your intent at the best price, handling all the complexity of bridging, routing, and gas optimization.
                </div>
              </div>

              {/* From Chain */}
              <div className="mb-4">
                <label className="text-sm text-gray mb-2 block">From</label>
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-glass border border-glass flex items-center justify-center">
                        <span className="text-white font-bold">
                          {fromChain.logo}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {fromChain.name}
                        </div>
                        <div className="text-xs text-gray">
                          Chain ID: {fromChain.chainId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray mb-1">Balance</div>
                      <div className="text-white font-semibold">
                        {fromChain.balance} {fromChain.nativeToken}
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center my-4">
                <button
                  onClick={handleSwapChains}
                  className="w-12 h-12 rounded-lg bg-glass border border-glass flex items-center justify-center hover:bg-glass transition-all"
                >
                  <span className="text-white text-xl">⇅</span>
                </button>
              </div>

              {/* To Chain */}
              <div className="mb-6">
                <label className="text-sm text-gray mb-2 block">To</label>
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-glass border border-glass flex items-center justify-center">
                        <span className="text-white font-bold">
                          {toChain.logo}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {toChain.name}
                        </div>
                        <div className="text-xs text-gray">
                          Chain ID: {toChain.chainId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray mb-1">Balance</div>
                      <div className="text-white font-semibold">
                        {toChain.balance} {toChain.nativeToken}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bridge Details */}
              <div className="stat-card mb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray">Estimated Time</span>
                    <span className="text-white font-semibold">~5-10 minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray">Bridge Fee</span>
                    <span className="text-white font-semibold">0.1%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray">You will receive</span>
                    <span className="text-white font-semibold">
                      {amount ? (parseFloat(amount) * 0.999).toFixed(4) : '0.0'} {toChain.nativeToken}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bridge Button */}
              <button
                onClick={handleBridge}
                disabled={!amount || parseFloat(amount) <= 0}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Intent
              </button>

              <div className="mt-3 text-xs text-white/50 text-center">
                Solvers will compete to execute your intent at the best rate
              </div>
            </div>

            {/* Features */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">
                Intent-Based Advantages
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <div className="text-white font-semibold mb-2">
                    Best Execution
                  </div>
                  <div className="text-sm text-gray">
                    Solvers compete to give you the best price. No need to compare bridges or routes manually.
                  </div>
                </div>
                <div className="stat-card">
                  <div className="text-white font-semibold mb-2">
                    Unified Policies
                  </div>
                  <div className="text-sm text-gray">
                    Same security policies enforced across all chains. Set once, protect everywhere.
                  </div>
                </div>
                <div className="stat-card">
                  <div className="text-white font-semibold mb-2">
                    Gas Abstraction
                  </div>
                  <div className="text-sm text-gray">
                    No need to hold native tokens on destination chain. Solvers handle gas payments.
                  </div>
                </div>
                <div className="stat-card">
                  <div className="text-white font-semibold mb-2">
                    MEV Protection
                  </div>
                  <div className="text-sm text-gray">
                    Commit-reveal mechanism works across all chains. Protected from MEV everywhere.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Multi-Chain Portfolio */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">
                Multi-Chain Portfolio
              </h3>
              <div className="space-y-3">
                {chains.map((chain) => (
                  <div key={chain.id} className="stat-card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-glass border border-glass flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {chain.logo}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">
                          {chain.name}
                        </div>
                        <div className="text-xs text-gray">
                          {chain.nativeToken}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {chain.balance}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="btn-secondary w-full text-left">
                  Bridge to 0G Network
                </button>
                <button className="btn-secondary w-full text-left">
                  Bridge to Ethereum
                </button>
                <button className="btn-secondary w-full text-left">
                  View All Chains
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">
                Bridge Stats
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray mb-1">Total Bridged</div>
                  <div className="text-2xl font-bold text-white">$24.5K</div>
                </div>
                <div>
                  <div className="text-xs text-gray mb-1">Transactions</div>
                  <div className="text-2xl font-bold text-white">47</div>
                </div>
                <div>
                  <div className="text-xs text-gray mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-white">100%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card mt-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            Recent Intent Executions
          </h3>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="stat-card flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="status-dot active"></div>
                  <div>
                    <div className="text-white font-semibold mb-1">
                      {tx.fromChain} → {tx.toChain}
                    </div>
                    <div className="text-xs text-gray">
                      {tx.timestamp}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray mb-1">Amount</div>
                    <div className="text-lg font-bold text-white">
                      {tx.amount} {tx.token}
                    </div>
                  </div>
                  <div className={`badge ${tx.status === 'Completed' ? 'badge-success' : ''}`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="card mt-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            How Intent-Based Cross-Chain Works
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="stat-card">
              <div className="text-lg font-bold text-white mb-3">
                1. Submit Intent
              </div>
              <div className="text-sm text-gray mb-4">
                Specify what you want: "Send 10 A0GI from 0G to Ethereum". No need to worry about routes, bridges, or gas.
              </div>
              <div className="text-xs text-gray-light">
                Simple, declarative interface
              </div>
            </div>

            <div className="stat-card">
              <div className="text-lg font-bold text-white mb-3">
                2. Solver Competition
              </div>
              <div className="text-sm text-gray mb-4">
                Multiple solvers compete to execute your intent. They find the best route, handle bridging, and optimize gas costs.
              </div>
              <div className="text-xs text-gray-light">
                Best price guaranteed
              </div>
            </div>

            <div className="stat-card">
              <div className="text-lg font-bold text-white mb-3">
                3. Automatic Execution
              </div>
              <div className="text-sm text-gray mb-4">
                Winning solver executes your intent. Funds arrive on destination chain. All policies enforced automatically.
              </div>
              <div className="text-xs text-gray-light">
                Seamless user experience
              </div>
            </div>
          </div>
        </div>

        {/* Supported Chains */}
        <div className="card mt-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            Supported Chains
          </h3>
          <div className="text-gray mb-6">
            Tenma provides unified cross-chain abstraction for multiple blockchain networks:
          </div>
          <div className="grid grid-cols-4 gap-4">
            {chains.map((chain) => (
              <div key={chain.id} className="stat-card text-center">
                <div className="w-12 h-12 rounded-lg bg-glass border border-glass flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">
                    {chain.logo}
                  </span>
                </div>
                <div className="text-white font-semibold mb-1">
                  {chain.name}
                </div>
                <div className="text-xs text-gray">
                  Chain ID: {chain.chainId}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
