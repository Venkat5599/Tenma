import { Link, useLocation } from 'react-router-dom'
import { useContracts } from '../hooks/useContracts'

export const Header = () => {
  const location = useLocation()
  const { account, isConnected, connectWallet, disconnectWallet } = useContracts()

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/privacy', label: 'Privacy' },
    { path: '/mev-analytics', label: 'MEV Analytics' },
    { path: '/cross-chain', label: 'Intent Cross-Chain' },
    { path: '/ai-chat', label: 'AI Chat' },
    { path: '/live-demo', label: 'Live Demo' },
    { path: '/policies', label: 'Policies' },
  ]

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-filter backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <div className="text-base font-bold text-white">
              TENMA
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest -mt-0.5">
              Privacy Layer
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-medium">
            {isConnected ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </span>
            ) : (
              'A0GI'
            )}
          </div>
          {isConnected ? (
            <button 
              onClick={disconnectWallet}
              className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold hover:bg-white/10 transition-all"
            >
              Disconnect
            </button>
          ) : (
            <button 
              onClick={connectWallet}
              className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
