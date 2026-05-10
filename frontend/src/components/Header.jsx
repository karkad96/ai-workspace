import { MoonIcon, SunIcon } from '../icons';
import styles from './Header.module.css';

export default function Header({ theme, onThemeToggle, user, onSignIn, onSignOut }) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.badge}>AI</div>
        <span className={styles.title}>AI Chat</span>
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

        <button type="button" className={styles.themeToggle} onClick={onThemeToggle}>
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>
    </header>
  );
}
