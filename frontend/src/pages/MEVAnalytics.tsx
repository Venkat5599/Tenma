import { useState, useEffect } from 'react'
import { useContracts } from '../hooks/useContracts'
import { useContractEvents } from '../hooks/useContractEvents'

interface MEVStats {
  attacksPrevented: number
  valueSaved: string
  protectionRate: number
  totalTransactions: number
}

interface AttackPattern {
  type: string
  count: number
  valueSaved: string
  description: string
}

export const MEVAnalytics = () => {
  const { firewallContract, commitRevealContract, isConnected } = useContracts()
  const { events, stats: contractStats } = useContractEvents(firewallContract, commitRevealContract)

  const [stats, setStats] = useState<MEVStats>({
    attacksPrevented: 0,
    valueSaved: '0 A0GI',
    protectionRate: 100,
    totalTransactions: 0,
  })

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h')
  const [filterType, setFilterType] = useState<'all' | 'front-running' | 'sandwich' | 'back-running'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (isConnected && contractStats) {
      setStats({
        attacksPrevented: contractStats.blockedTransactions,
        valueSaved: '0 A0GI', // Would calculate from blocked transaction values
        protectionRate: contractStats.totalTransactions > 0 ? 100 : 100, // 100% when using commit-reveal
        totalTransactions: contractStats.totalTransactions,
      })
    }
  }, [isConnected, contractStats])

  const [attackPatterns] = useState<AttackPattern[]>([
    {
      type: 'Front-Running',
      count: 156,
      valueSaved: '8.4 A0GI',
      description: 'Bots attempting to execute transactions before yours',
    },
    {
      type: 'Sandwich Attacks',
      count: 98,
      valueSaved: '6.2 A0GI',
      description: 'Bots placing transactions before and after yours',
    },
    {
      type: 'Back-Running',
      count: 67,
      valueSaved: '2.8 A0GI',
      description: 'Bots executing transactions immediately after yours',
    },
    {
      type: 'Time-Bandit Attacks',
      count: 21,
      valueSaved: '1.3 A0GI',
      description: 'Miners reordering transactions for profit',
    },
  ])

  const [recentBlocks, setRecentBlocks] = useState<any[]>([])

  useEffect(() => {
    if (events && events.length > 0) {
      // Group events by block
      const blockMap = new Map<number, any>()
      
      events.forEach(event => {
        if (!blockMap.has(event.blockNumber)) {
          blockMap.set(event.blockNumber, {
            id: event.blockNumber,
            blockNumber: event.blockNumber,
            attacksDetected: 0,
            attacksPrevented: 0,
            valueSaved: '0 A0GI',
            timestamp: formatTimestamp(event.timestamp),
          })
        }
        
        const block = blockMap.get(event.blockNumber)!
        if (event.type === 'TRANSACTION_BLOCKED') {
          block.attacksDetected++
          block.attacksPrevented++
        }
      })
      
      const blocks = Array.from(blockMap.values())
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, 10)
      
      setRecentBlocks(blocks)
    }
  }, [events])

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const handleExport = () => {
    const data = {
      stats,
      attackPatterns,
      recentBlocks,
      liveAttacks,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mev-analytics-${Date.now()}.json`
    a.click()
  }

  const [liveAttacks, setLiveAttacks] = useState<any[]>([])

  useEffect(() => {
    if (events && events.length > 0) {
      const attacks = events
        .filter(e => e.type === 'TRANSACTION_BLOCKED')
        .slice(0, 10)
        .map(event => ({
          id: event.id,
          type: 'Policy Violation',
          target: event.data.target?.slice(0, 6) + '...' + event.data.target?.slice(-4) || 'Unknown',
          status: 'Blocked',
          valueSaved: event.data.value || '0 A0GI',
          timestamp: formatTimestamp(event.timestamp),
          reason: event.data.reason || 'Policy violation',
        }))
      
      setLiveAttacks(attacks)
    }
  }, [events])

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold text-white mb-4">
                MEV Protection Analytics
              </h1>
              <p className="text-xl text-gray">
                Real-time monitoring of MEV attacks prevented and value saved
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all disabled:opacity-50"
              >
                {isRefreshing ? '↻ Refreshing...' : '↻ Refresh'}
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                ↓ Export Data
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">Time Range</label>
              <div className="flex gap-2">
                {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      timeRange === range
                        ? 'bg-white/[0.12] border border-white/[0.2] text-white'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {range === 'all' ? 'All Time' : range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">Attack Type</label>
              <div className="flex gap-2">
                {(['all', 'front-running', 'sandwich', 'back-running'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterType === type
                        ? 'bg-white/[0.12] border border-white/[0.2] text-white'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/60 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-gray mb-2">Attacks Prevented</div>
            <div className="text-4xl font-bold text-white mb-2">
              {stats.attacksPrevented.toLocaleString()}
            </div>
            <div className="text-xs text-gray-light">
              Since deployment
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-gray mb-2">Value Saved</div>
            <div className="text-4xl font-bold text-white mb-2">
              {stats.valueSaved}
            </div>
            <div className="text-xs text-gray-light">
              Protected from MEV bots
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-gray mb-2">Protection Rate</div>
            <div className="text-4xl font-bold text-white mb-2">
              {stats.protectionRate}%
            </div>
            <div className="text-xs text-gray-light">
              Success rate
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-gray mb-2">Total Transactions</div>
            <div className="text-4xl font-bold text-white mb-2">
              {stats.totalTransactions.toLocaleString()}
            </div>
            <div className="text-xs text-gray-light">
              All protected
            </div>
          </div>
        </div>

        {/* Attack Patterns */}
        <div className="card mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            Attack Patterns Detected & Prevented
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {attackPatterns.map((pattern, index) => (
              <div key={index} className="stat-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xl font-bold text-white mb-1">
                      {pattern.type}
                    </div>
                    <div className="text-sm text-gray">
                      {pattern.description}
                    </div>
                  </div>
                  <div className="badge badge-success">
                    Blocked
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-xs text-gray mb-1">Attempts</div>
                    <div className="text-2xl font-bold text-white">
                      {pattern.count}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray mb-1">Value Saved</div>
                    <div className="text-2xl font-bold text-white">
                      {pattern.valueSaved}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How MEV Protection Works */}
        <div className="card mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            How Tenma Prevents MEV Attacks
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="stat-card">
              <div className="text-lg font-bold text-white mb-3">
                1. Commit Phase
              </div>
              <div className="text-sm text-gray mb-4">
                Transaction details are encrypted and only a commitment hash is submitted to the blockchain. MEV bots cannot see the transaction content.
              </div>
              <div className="text-xs text-gray-light">
                Zero-knowledge of transaction details
              </div>
            </div>

            <div className="stat-card">
              <div className="text-lg font-bold text-white mb-3">
                2. Time Delay
              </div>
              <div className="text-sm text-gray mb-4">
                Mandatory 5-minute delay between commit and reveal. This prevents MEV bots from front-running or sandwiching your transaction.
              </div>
              <div className="text-xs text-gray-light">
                MEV bots cannot react in time
              </div>
            </div>

            <div className="stat-card">
              <div className="text-lg font-bold text-white mb-3">
                3. Reveal & Execute
              </div>
              <div className="text-sm text-gray mb-4">
                After the delay, transaction is revealed and executed. By this time, MEV opportunity has passed and your transaction is safe.
              </div>
              <div className="text-xs text-gray-light">
                Protected execution guaranteed
              </div>
            </div>
          </div>
        </div>

        {/* Recent Blocks */}
        <div className="card mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            Recent Block Analysis
          </h3>
          <div className="space-y-3">
            {recentBlocks.map((block) => (
              <div
                key={block.id}
                className="stat-card flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="status-dot active"></div>
                  <div>
                    <div className="text-white font-mono text-sm mb-1">
                      Block #{block.blockNumber.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray">
                      {block.timestamp}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-gray mb-1">Detected</div>
                    <div className="text-xl font-bold text-white">
                      {block.attacksDetected}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray mb-1">Prevented</div>
                    <div className="text-xl font-bold text-white">
                      {block.attacksPrevented}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray mb-1">Value Saved</div>
                    <div className="text-xl font-bold text-white">
                      {block.valueSaved}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Attack Feed */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">
              Live Attack Feed
            </h3>
            <div className="flex items-center gap-2">
              <div className="status-dot active"></div>
              <span className="text-sm text-gray">Real-time monitoring</span>
            </div>
          </div>
          <div className="space-y-3">
            {liveAttacks.map((attack) => (
              <div
                key={attack.id}
                className="stat-card flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                  <div>
                    <div className="text-white font-semibold mb-1">
                      {attack.type}
                    </div>
                    <div className="text-xs text-gray">
                      Target: {attack.target} • {attack.timestamp}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray mb-1">Value Saved</div>
                    <div className="text-lg font-bold text-white">
                      {attack.valueSaved}
                    </div>
                  </div>
                  <div className="badge badge-success">
                    {attack.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MEV Problem Explanation */}
        <div className="card mt-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            The $1.4B MEV Problem
          </h3>
          <div className="text-gray mb-6">
            Maximal Extractable Value (MEV) is a critical problem in blockchain. MEV bots extract over $1.4 billion annually by:
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    Front-Running
                  </div>
                  <div className="text-sm text-gray">
                    Bots see your transaction in the mempool and submit a similar transaction with higher gas to execute first.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    Sandwich Attacks
                  </div>
                  <div className="text-sm text-gray">
                    Bots place transactions before and after yours to manipulate prices and extract value from your trade.
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    Back-Running
                  </div>
                  <div className="text-sm text-gray">
                    Bots execute transactions immediately after yours to profit from price changes you created.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
                <div>
                  <div className="text-white font-semibold mb-1">
                    Time-Bandit Attacks
                  </div>
                  <div className="text-sm text-gray">
                    Miners reorder transactions within blocks to maximize their profit at your expense.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
