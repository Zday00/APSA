import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,10,10,.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1e1e1e',
      height: '58px',
      display: 'flex', alignItems: 'center',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <div style={{
            width: '30px', height: '30px', background: '#E85D04',
            borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f5f5f5', letterSpacing: '-.01em' }}>
            APSA
          </span>
        </Link>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {token ? (
            <>
              <Link
                to="/dashboard"
                style={{ color: '#777', fontSize: '.875rem', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.color = '#777'}
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                style={{
                  background: 'none', border: '1px solid #2a2a2a', color: '#777',
                  fontSize: '.875rem', cursor: 'pointer', padding: '6px 14px',
                  borderRadius: '8px', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85D04'; e.currentTarget.style.color = '#E85D04' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#777' }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{ color: '#777', fontSize: '.875rem', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.color = '#777'}
              >
                Connexion
              </Link>
              <Link
                to="/register"
                style={{
                  background: '#E85D04', color: '#fff', fontSize: '.875rem',
                  padding: '6px 14px', borderRadius: '8px', textDecoration: 'none',
                  fontWeight: 600, transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#d0520a'}
                onMouseLeave={e => e.currentTarget.style.background = '#E85D04'}
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
