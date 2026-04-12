import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/home" className="text-xl font-bold text-blue-600">APSA</Link>
      <div className="flex items-center gap-4">
        {token ? (
          <>
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">Dashboard</Link>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500">Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600">Connexion</Link>
            <Link to="/register" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Inscription</Link>
          </>
        )}
      </div>
    </nav>
  )
}
