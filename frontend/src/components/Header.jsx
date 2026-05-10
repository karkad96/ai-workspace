import { MenuIcon, MoonIcon, SunIcon } from '../icons';
import styles from './Header.module.css';

export default function Header({ theme, onThemeToggle, user, onSignIn, onSignOut, onToggleSidebar }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {user && (
          <button type="button" className={styles.iconBtn} onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <MenuIcon />
          </button>
        )}
        <div className={styles.brand}>
          <div className={styles.badge}>AI</div>
          <span className={styles.title}>AI Chat</span>
        </div>
      </div>

      <div className={styles.actions}>
        {user ? (
          <>
            <span className={styles.userEmail}>{user.email}</span>
            <button type="button" className={styles.authBtn} onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <button type="button" className={`${styles.authBtn} ${styles.authBtnAccent}`} onClick={onSignIn}>
            Sign in
          </button>
        )}

        <button type="button" className={styles.iconBtn} onClick={onThemeToggle} aria-label="Toggle theme">
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>
    </header>
  );
}
