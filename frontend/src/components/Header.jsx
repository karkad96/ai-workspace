import styles from './Header.module.css';

export default function Header({ theme, onThemeToggle }) {
  return (
    <header className={styles.header}>
      <div>
        <div className={styles.badge}>AI</div>
        <h1 className={styles.title}>AI Chat</h1>
        <p className={styles.subtitle}>A clean messaging UI for your local assistant.</p>
      </div>
      <button type="button" className={styles.themeToggle} onClick={onThemeToggle}>
        {theme === 'light' ? 'Dark mode' : 'Light mode'}
      </button>
    </header>
  );
}
