import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import LandingPage from './pages/LandingPage'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f5f5f5', fontFamily: 'system-ui,-apple-system,Segoe UI,sans-serif' }}>
                <Navbar />
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
