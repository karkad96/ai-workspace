import { PlusIcon, TrashIcon } from '../icons';
import styles from './Sidebar.module.css';

function groupByDate(conversations) {
  const now = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOf(now);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30);

  const buckets = { Today: [], Yesterday: [], 'Previous 7 days': [], 'Previous 30 days': [], Older: [] };

  for (const conv of conversations) {
    const d = new Date(conv.updated_at);
    const day = startOf(d);
    if (day >= today) buckets.Today.push(conv);
    else if (day >= yesterday) buckets.Yesterday.push(conv);
    else if (d >= weekAgo) buckets['Previous 7 days'].push(conv);
    else if (d >= monthAgo) buckets['Previous 30 days'].push(conv);
    else buckets.Older.push(conv);
  }

  return Object.entries(buckets).filter(([, items]) => items.length > 0);
}

export default function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete, onClose }) {
  const groups = groupByDate(conversations);

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.top}>
          <button className={styles.newBtn} onClick={onNew}>
            <PlusIcon />
            <span>New chat</span>
          </button>
        </div>

        <div className={styles.list}>
          {groups.length === 0 && (
            <p className={styles.empty}>No conversations yet</p>
          )}
          {groups.map(([label, items]) => (
            <div key={label} className={styles.group}>
              <div className={styles.groupLabel}>{label}</div>
              {items.map((conv) => (
                <button
                  key={conv.id}
                  className={`${styles.item} ${conv.id === activeId ? styles.active : ''}`}
                  onClick={() => onSelect(conv.id)}
                  title={conv.title}
                >
                  <span className={styles.itemTitle}>{conv.title}</span>
                  <span
                    className={styles.deleteBtn}
                    role="button"
                    tabIndex={0}
                    aria-label="Delete conversation"
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDelete(conv.id); } }}
                  >
                    <TrashIcon />
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
