type ToastProps = {
  message: string;
  tone: 'success' | 'error';
};

export function Toast({ message, tone }: ToastProps) {
  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
