// Minimal toast bus: the Reader (and future routes) dispatch a DOM
// CustomEvent that the always-mounted <Toast/> host (src/components/Toast.tsx)
// listens for, so no React context/provider plumbing is needed to reach it
// from anywhere in the tree.
export const TOAST_EVENT = 'be-toast';

export function toast(message: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));
}
