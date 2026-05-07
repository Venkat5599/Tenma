import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItem {
  path: string
  label: string
  icon: string
}

export const Sidebar = () => {
  const location = useLocation()

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/policy', label: 'Policies', icon: '🛡️' },
    { path: '/transactions', label: 'Audit Logs', icon: '📋' },
  ]

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0a1419] border-r border-cyan/20 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-cyan/20">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan/30 to-cyan/10 flex items-center justify-center border border-cyan/30">
            <span className="text-cyan font-bold text-xl">T</span>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              <span className="text-cyan">TENMA</span> Firewall
            </div>
            <div className="text-xs text-gray-400">
              ON-CHAIN SECURITY LAYER
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium',
                isActive(item.path)
                  ? 'bg-cyan/10 text-cyan border border-cyan/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-cyan/20 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Network</span>
          <span className="text-white font-semibold">0G Newton</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Firewall</span>
          <div className="flex items-center gap-2">
            <div className="status-dot active"></div>
            <span className="text-green font-semibold">Active</span>
          </div>
        </div>
        <button className="w-full btn-primary text-sm py-2">
          Connect Wallet
        </button>
      </div>
    </aside>
  )
}
