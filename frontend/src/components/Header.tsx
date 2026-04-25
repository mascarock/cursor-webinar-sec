import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <Link to="/groups" className={styles.brand}>
          <img
            className={styles.brandLogo}
            src="/brand/logo-icon.svg"
            alt=""
            aria-hidden="true"
          />
          <span className={styles.brandName}>finfam</span>
        </Link>

        {currentUser && (
          <div className={styles.userBar}>
            <span className={styles.hideMobile}>
              Hola, <strong>{currentUser}</strong>
            </span>
            <button className="btn-icon" onClick={handleLogout}>
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
