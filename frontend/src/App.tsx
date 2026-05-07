import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Lenis from 'lenis'
import { PlumBackground } from './components/PlumBackground'
import { Header } from './components/Header'
import { Dashboard } from './pages/Dashboard'
import { PolicyConfig } from './pages/PolicyConfig'
import { LiveDemo } from './pages/LiveDemo'
import { AITradingChat } from './pages/AITradingChat'
import { PrivacyDashboard } from './pages/PrivacyDashboard'
import { MEVAnalytics } from './pages/MEVAnalytics'
import { CrossChainBridge } from './pages/CrossChainBridge'

function App() {
  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <Router>
      <PlumBackground />
      <div className="min-h-screen relative z-10">
        <Header />
        <main className="pt-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ai-chat" element={<AITradingChat />} />
            <Route path="/live-demo" element={<LiveDemo />} />
            <Route path="/privacy" element={<PrivacyDashboard />} />
            <Route path="/mev-analytics" element={<MEVAnalytics />} />
            <Route path="/cross-chain" element={<CrossChainBridge />} />
            <Route path="/policies" element={<PolicyConfig />} />
            <Route path="/audit-logs" element={<ComingSoon title="Audit Logs" />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

const ComingSoon = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
      <p className="text-gray-400">Coming soon...</p>
    </div>
  </div>
)

export default App
