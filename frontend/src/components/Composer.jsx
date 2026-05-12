import { useEffect, useRef, useState } from 'react';
import { SendIcon, StopIcon, PaperclipIcon } from '../icons';
import styles from './Composer.module.css';

const MAX_HEIGHT = 200;

function readFileAsBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      resolve({ id: crypto.randomUUID(), dataUrl, base64: dataUrl.split(',')[1] });
    };
    reader.readAsDataURL(file);
  });
}

export default function Composer({ message, isStreaming, onChange, onSend, onStop }) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = next + 'px';
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [message]);

  const addFiles = async (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const results = await Promise.all(imageFiles.map(readFileAsBase64));
    setImages((prev) => [...prev, ...results]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    onSend(images);
    setImages([]);
  };

  const canSend = message.trim() || images.length > 0;

  return (
    <div className={styles.composer}>
      <div
        className={`${styles.box} ${dragging ? styles.dragging : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {images.length > 0 && (
          <div className={styles.previews}>
            {images.map((img) => (
              <div key={img.id} className={styles.preview}>
                <img src={img.dataUrl} alt="attachment" />
                <button
                  className={styles.removeImg}
                  onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={message}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dragging ? 'Drop image here…' : 'Write a message…'}
          rows={1}
        />

        <div className={styles.toolbar}>
          <button
            className={styles.attachButton}
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            type="button"
          >
            <PaperclipIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className={styles.fileInput}
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
          />
          {isStreaming ? (
            <button className={`${styles.iconButton} ${styles.stopButton}`} onClick={onStop} title="Stop">
              <StopIcon />
            </button>
          ) : (
            <button
              className={`${styles.iconButton} ${styles.sendButton}`}
              onClick={handleSend}
              disabled={!canSend}
              title="Send"
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
