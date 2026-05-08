import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useContracts } from '../hooks/useContracts'
import { useTransactionStats } from '../hooks/useTransactionStats'

export const Dashboard = () => {
  const {
    account,
    isConnected,
    connectWallet,
    firewallContract,
    commitRevealContract,
  } = useContracts()

  const { stats: contractStats } = useTransactionStats(firewallContract, commitRevealContract)

  const stats = [
    { 
      label: 'Total Transactions', 
      value: contractStats.totalTransactions.toString(), 
      unit: '' 
    },
    { 
      label: 'Executed', 
      value: contractStats.executedTransactions.toString(), 
      unit: '' 
    },
    { 
      label: 'Blocked', 
      value: contractStats.blockedTransactions.toString(), 
      unit: '' 
    },
    { 
      label: 'Block Rate', 
      value: contractStats.blockRate.toFixed(1), 
      unit: '%' 
    },
  ]

  const verifiedContracts = [
    {
      name: 'TENMA FIREWALL',
      address: '0x05Ef28B338B1521837Ccb8B4fDb74b2075D7D7F9',
    },
    {
      name: 'COMMIT REVEAL CONTRACT',
      address: '0xD98359F3E80d11703267ff75f03bA4E1B4f7B58d',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Live Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="status-dot active"></div>
              <span className="text-xs font-medium text-white/80">Live on 0G Newton Testnet</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-semibold text-center mb-6 text-white tracking-tight">
            TENMA Privacy Layer
          </h1>
          <p className="text-center text-lg text-white/50 max-w-2xl mx-auto mb-16 leading-relaxed">
            Privacy-preserving sovereign infrastructure for Web 4.0. End-to-end encryption, MEV protection, and user-controlled policies enforced on-chain.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.03] hover:border-white/[0.1] transition-all">
                <div className="text-[10px] text-white/40 font-medium tracking-wider uppercase mb-2">
                  {stat.label}
                </div>
                <div className="flex items-baseline gap-1">
                  <div className="text-4xl font-semibold text-white">
                    {stat.value}
                  </div>
                  {stat.unit && (
                    <div className="text-lg text-white/40 font-medium">
                      {stat.unit}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Navigation */}
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            <Link to="/privacy" className="px-5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm font-medium hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all">
              Privacy Dashboard
            </Link>
            <Link to="/mev-analytics" className="px-5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm font-medium hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all">
              MEV Analytics
            </Link>
            <Link to="/cross-chain" className="px-5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm font-medium hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all">
              Intent Cross-Chain
            </Link>
            <Link to="/ai-chat" className="px-5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm font-medium hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all">
              AI Trading Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-1">Quick Actions</h3>
              <p className="text-sm text-white/50">Manage your AI agent policies and security</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/policy-config'}
                className="w-full p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium mb-1">Configure Policies</div>
                    <div className="text-xs text-white/50">Set spending limits and security rules</div>
                  </div>
                  <div className="text-white/30 group-hover:text-white/60 transition-colors">→</div>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/ai-trading-chat'}
                className="w-full p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium mb-1">AI Trading Chat</div>
                    <div className="text-xs text-white/50">Interact with protected AI agents</div>
                  </div>
                  <div className="text-white/30 group-hover:text-white/60 transition-colors">→</div>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/live-demo'}
                className="w-full p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium mb-1">Live Demo</div>
                    <div className="text-xs text-white/50">Watch real-time firewall protection</div>
                  </div>
                  <div className="text-white/30 group-hover:text-white/60 transition-colors">→</div>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/cross-chain-bridge'}
                className="w-full p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium mb-1">Intent Cross-Chain</div>
                    <div className="text-xs text-white/50">Seamless multi-chain operations</div>
                  </div>
                  <div className="text-white/30 group-hover:text-white/60 transition-colors">→</div>
                </div>
              </button>
            </div>

            {!isConnected && (
              <div className="mt-6 p-4 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <div className="text-sm text-white/60 mb-3">Connect your wallet to get started</div>
                <button 
                  onClick={connectWallet}
                  className="w-full btn-primary text-base py-3"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Verified Contracts */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Verified Contracts</h3>
                <p className="text-sm text-white/50">Source Verified on 0G Network</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-semibold uppercase tracking-wider">
                Verified
              </span>
            </div>
            
            <div className="space-y-3">
              {verifiedContracts.map((contract, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1] transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white mb-1">{contract.name}</div>
                      <div className="text-xs font-mono text-white/40">{contract.address}</div>
                    </div>
                    <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
