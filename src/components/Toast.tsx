import { useEffect, useRef, useState } from 'react';
import { TOAST_EVENT } from '../lib/toast';

const DISPLAY_MS = 2200;

// Listens for the CustomEvent dispatched by lib/toast.ts's toast(message)
// and shows it in this fixed host for ~2.2s, matching the legacy app's
// toast()/toast.timer behaviour.
export function Toast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof window.setTimeout>>();

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setMessage(detail);
      setVisible(true);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setVisible(false), DISPLAY_MS);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div id="toast" className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
