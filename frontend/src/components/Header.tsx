import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale, type Locale } from '../i18n';
import styles from './Header.module.css';

/** Splits a greeting like "Hi, %NAME%" so the user name can be rendered bold. */
function renderGreeting(template: string, name: string) {
  const parts = template.split('%NAME%');
  return (
    <>
      {parts[0]}
      <strong>{name}</strong>
      {parts[1] ?? ''}
    </>
  );
}

function LanguageSwitcher() {
  const { locale, setLocale, available, t } = useLocale();
  return (
    <select
      className={styles.langSelect}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label={t('header.languageLabel')}
    >
      {available.map((code) => (
        <option key={code} value={code}>
          {t(`languages.${code}`)}
        </option>
      ))}
    </select>
  );
}

export default function Header() {
  const { currentUser, logout } = useAuth();
  const { t } = useLocale();
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

        <div className={styles.userBar}>
          <LanguageSwitcher />
          {currentUser && (
            <>
              <span className={styles.hideMobile}>
                {renderGreeting(t('header.greeting', { name: '%NAME%' }), currentUser)}
              </span>
              <button className="btn-icon" onClick={handleLogout}>
                {t('header.logout')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
