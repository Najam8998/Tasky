// App.tsx — Root with routing, wallet, AI monitor and notifications
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WalletContextProvider } from './context/WalletContext'
import { NotificationProvider } from './context/NotificationContext'
import { AIProvider } from './context/AIContext'
import { Navbar } from './components/Navbar'
import { AIPanel } from './components/AIPanel'
import { Home } from './pages/Home'
import { CreateTask } from './pages/CreateTask'
import { Dashboard } from './pages/Dashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { TaskDetail } from './pages/TaskDetail'
import { Analytics } from './pages/Analytics'
import { Profile } from './pages/Profile'
import { BlockchainGalaxy } from './components/BlockchainGalaxy'

function App() {
  return (
    <WalletContextProvider>
      <BrowserRouter>
        <NotificationProvider>
          <AIProvider>
            <Navbar />
            <BlockchainGalaxy />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Routes>
                <Route path="/"            element={<Home />} />
                <Route path="/dashboard"   element={<Dashboard />} />
                {/* Legacy redirects — old links still work */}
                <Route path="/client"      element={<Navigate to="/dashboard" replace />} />
                <Route path="/expert"      element={<Navigate to="/dashboard" replace />} />
                <Route path="/create"      element={<CreateTask />} />
                <Route path="/admin"       element={<AdminDashboard />} />
                <Route path="/tasks/:id"   element={<TaskDetail />} />
                <Route path="/analytics"   element={<Analytics />} />
                <Route path="/profile"     element={<Profile />} />
              </Routes>
            </div>
            <AIPanel />
          </AIProvider>
        </NotificationProvider>
      </BrowserRouter>
    </WalletContextProvider>
  )
}

export default App
