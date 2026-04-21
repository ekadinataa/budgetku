import { useEffect } from 'react';
import NavIcon from '../icons/NavIcon';
import styles from './Modal.module.css';

/**
 * Modal — Fixed overlay dialog with backdrop blur, Escape key and backdrop click to close.
 *
 * Ported from the prototype's shared.jsx Modal component, converted from inline styles
 * to CSS Modules with theme-aware CSS custom properties.
 *
 * @param {Object} props
 * @param {string} props.title - Header title text
 * @param {() => void} props.onClose - Callback invoked when the modal should close
 * @param {React.ReactNode} props.children - Modal body content
 * @param {number} [props.width=480] - Maximum width of the modal content in pixels
 */
export default function Modal({ title, onClose, children, width = 480 }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={styles.modal}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <NavIcon name="close" size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
