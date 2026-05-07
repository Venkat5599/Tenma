import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useContracts } from '../hooks/useContracts'

export const PolicyConfig = () => {
  const { isConnected, getPolicy, setPolicy, addToWhitelist } = useContracts()
  
  const [config, setConfig] = useState({
    maxTransactionAmount: '1.0',
    maxDailyAmount: '10.0',
    maxGasPrice: '100',
    whitelistedContracts: [] as string[],
    maxRiskScore: 5,
    requireApproval: true,
    timeRestrictions: {
      enabled: false,
      startHour: 9,
      endHour: 17,
    },
  })

  const [newContract, setNewContract] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load policy from blockchain
  useEffect(() => {
    const loadPolicy = async () => {
      if (!isConnected) return
      
      setIsLoading(true)
      try {
        const policy = await getPolicy()
        if (policy) {
          setConfig({
            maxTransactionAmount: policy.maxTransactionAmount,
            maxDailyAmount: policy.maxDailyAmount,
            maxGasPrice: policy.maxGasPrice,
            whitelistedContracts: [], // Would need to track separately
            maxRiskScore: policy.maxRiskScore,
            requireApproval: policy.requireApproval,
            timeRestrictions: policy.timeRestrictions,
          })
        }
      } catch (error) {
        console.error('Error loading policy:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPolicy()
  }, [isConnected, getPolicy])

  const handleSaveConfig = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    setIsSaving(true)
    try {
      // Save policy to blockchain
      await setPolicy(
        config.maxTransactionAmount,
        config.maxDailyAmount,
        config.maxGasPrice,
        config.maxRiskScore,
        config.requireApproval
      )

      alert('✅ Policy saved to blockchain successfully!')
    } catch (error: any) {
      console.error('Error saving policy:', error)
      alert(`❌ Failed to save policy: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddContract = async () => {
    if (!newContract) return
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(newContract)) {
      alert('Invalid contract address')
      return
    }

    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (config.whitelistedContracts.includes(newContract)) {
      alert('Contract already whitelisted')
      return
    }

    try {
      // Add to blockchain whitelist
      await addToWhitelist(newContract)
      
      setConfig(prev => ({
        ...prev,
        whitelistedContracts: [...prev.whitelistedContracts, newContract],
      }))
      setNewContract('')
      
      alert('✅ Contract added to whitelist on blockchain!')
    } catch (error: any) {
      console.error('Error adding to whitelist:', error)
      alert(`❌ Failed to add contract: ${error.message || 'Unknown error'}`)
    }
  }

  const handleRemoveContract = (contract: string) => {
    setConfig(prev => ({
      ...prev,
      whitelistedContracts: prev.whitelistedContracts.filter(c => c !== contract),
    }))
  }

  const stats = [
    { label: 'Total Policies', value: '5' },
    { label: 'Active', value: config.requireApproval ? '5' : '4' },
    { label: 'Whitelisted', value: config.whitelistedContracts.length.toString() },
    { label: 'Status', value: isConnected ? 'Connected' : 'Disconnected' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">
          ON-CHAIN POLICY CONFIGURATION
        </h1>
        <p className="text-sm text-gray">
          Set blockchain-enforced rules for AI agents - policies validated on-chain before execution
        </p>
        {!isConnected && (
          <div className="mt-4 p-3 bg-white/10 border border-white/30 rounded-lg">
            <p className="text-sm text-white">
              ⚠️ Please connect your wallet to load and save policies
            </p>
          </div>
        )}
        {isLoading && (
          <div className="mt-4 p-3 bg-glass border border-glass rounded-lg">
            <p className="text-sm text-white">
              Loading policy from blockchain...
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card glass-reflection">
            <div className="text-xs uppercase text-gray-light mb-2">{stat.label}</div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Amount Limits */}
        <div className="card glass-reflection">
          <div className="mb-6">
            <h3 className="text-sm uppercase text-white font-bold">AMOUNT LIMITS</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-gray mb-2">
                Max Transaction Amount (A0GI)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.maxTransactionAmount}
                onChange={(e) => setConfig(prev => ({ ...prev, maxTransactionAmount: e.target.value }))}
                className="input"
              />
              <p className="text-xs text-gray-light mt-1">
                AI agents cannot execute transactions above this amount
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase text-gray mb-2">
                Max Daily Amount (A0GI)
              </label>
              <input
                type="number"
                step="1"
                value={config.maxDailyAmount}
                onChange={(e) => setConfig(prev => ({ ...prev, maxDailyAmount: e.target.value }))}
                className="input"
              />
              <p className="text-xs text-gray-light mt-1">
                Total daily transaction limit across all agents
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase text-gray mb-2">
                Max Gas Price (Gwei)
              </label>
              <input
                type="number"
                step="10"
                value={config.maxGasPrice}
                onChange={(e) => setConfig(prev => ({ ...prev, maxGasPrice: e.target.value }))}
                className="input"
              />
              <p className="text-xs text-gray-light mt-1">
                Prevent agents from paying excessive gas fees
              </p>
            </div>
          </div>
        </div>

        {/* Risk & Approval */}
        <div className="card glass-reflection">
          <div className="mb-6">
            <h3 className="text-sm uppercase text-white font-bold">RISK & APPROVAL</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-gray mb-2">
                Max Risk Score (0-10)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={config.maxRiskScore}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxRiskScore: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-white w-12 text-right">
                  {config.maxRiskScore}
                </span>
              </div>
              <p className="text-xs text-gray-light mt-1">
                Block transactions with risk score above this threshold
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-glass rounded border border-glass">
              <div>
                <div className="text-sm uppercase text-white mb-1">
                  Require Manual Approval
                </div>
                <div className="text-xs text-gray">
                  All agent transactions need your approval
                </div>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, requireApproval: !prev.requireApproval }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  config.requireApproval ? 'bg-white/30' : 'bg-white/10'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  config.requireApproval ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="p-4 bg-glass border border-glass rounded">
              <div className="text-xs uppercase text-white mb-2">
                TIME RESTRICTIONS
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray">Enable time-based limits</span>
                <button
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    timeRestrictions: { ...prev.timeRestrictions, enabled: !prev.timeRestrictions.enabled }
                  }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    config.timeRestrictions.enabled ? 'bg-white/30' : 'bg-white/10'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    config.timeRestrictions.enabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
              {config.timeRestrictions.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray mb-1">Start Hour</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={config.timeRestrictions.startHour}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        timeRestrictions: { ...prev.timeRestrictions, startHour: parseInt(e.target.value) }
                      }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray mb-1">End Hour</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={config.timeRestrictions.endHour}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        timeRestrictions: { ...prev.timeRestrictions, endHour: parseInt(e.target.value) }
                      }))}
                      className="input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Whitelist */}
      <div className="card glass-reflection mb-8">
        <div className="mb-6">
          <h3 className="text-sm uppercase text-white font-bold mb-2">CONTRACT WHITELIST</h3>
          <p className="text-xs text-gray">
            AI agents can only interact with whitelisted contracts. Add trusted DEXs, protocols, and contracts below.
          </p>
        </div>
        
        <div className="mb-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newContract}
              onChange={(e) => setNewContract(e.target.value)}
              placeholder="0x..."
              className="input flex-1"
            />
            <Button onClick={handleAddContract} className="btn-primary">
              Add Contract
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {config.whitelistedContracts.length === 0 ? (
            <div className="text-center py-8 text-gray text-sm">
              No whitelisted contracts yet. Add contracts to allow agent interactions.
            </div>
          ) : (
            config.whitelistedContracts.map((contract, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-glass border border-glass rounded hover:border-white/30 transition-colors"
              >
                <span className="text-sm text-white font-mono">{contract}</span>
                <Button
                  className="btn-secondary"
                  onClick={() => handleRemoveContract(contract)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 mb-8">
        <Button 
          onClick={handleSaveConfig} 
          disabled={!isConnected || isSaving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving to Blockchain...' : 'Save Policy to Blockchain'}
        </Button>
      </div>

      {/* Info Box */}
      <div className="card glass-reflection bg-glass border-glass">
        <div className="mb-4">
          <h3 className="text-sm uppercase text-white font-bold">
            HOW ON-CHAIN POLICY ENFORCEMENT WORKS
          </h3>
        </div>
        <div className="space-y-2 text-xs text-gray leading-relaxed">
          <p>
            <span className="text-white">1. AI Agent Decision:</span> Your AI agent decides to execute a transaction (trade, transfer, contract interaction)
          </p>
          <p>
            <span className="text-white">2. On-Chain Validation:</span> Smart contract validates transaction against blockchain-stored policies - cannot be bypassed
          </p>
          <p>
            <span className="text-white">3. Pass/Fail:</span> If all on-chain policies pass, transaction proceeds. If any policy fails, smart contract reverts.
          </p>
          <p>
            <span className="text-white">4. MEV Protection:</span> Approved transactions are encrypted with AES-256-GCM and submitted via commit-reveal
          </p>
          <p>
            <span className="text-white">5. On-Chain Execution:</span> After 5-minute delay, transaction is revealed and executed - all validation on blockchain
          </p>
          <p className="pt-2 border-t border-glass">
            <span className="text-white">KEY ADVANTAGE:</span> Policies are enforced by smart contracts on 0G Network. AI agents cannot bypass, modify, or circumvent rules - blockchain guarantees enforcement.
          </p>
        </div>
      </div>
    </div>
  )
}
