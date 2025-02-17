import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from './alert';

export function ConnectionAlert() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const handleConnectionRetry = (event: CustomEvent<{ attempt: number; error: string }>) => {
      setAttempt(event.detail.attempt);
      setMessage(event.detail.error);
      setIsOpen(true);
    };

    const handleDialRetry = (event: CustomEvent<{ attempt: number; error: string; addr: string }>) => {
      setAttempt(event.detail.attempt);
      setMessage(`Failed to dial ${event.detail.addr}: ${event.detail.error}`);
      setIsOpen(true);
    };

    window.addEventListener('libp2p:connection:retry' as any, handleConnectionRetry);
    window.addEventListener('libp2p:dial:retry' as any, handleDialRetry);

    return () => {
      window.removeEventListener('libp2p:connection:retry' as any, handleConnectionRetry);
      window.removeEventListener('libp2p:dial:retry' as any, handleDialRetry);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <Alert open={isOpen} onClose={() => setIsOpen(false)}>
      <AlertTitle>Connection Retry</AlertTitle>
      <AlertDescription>
        Attempt {attempt}/3: {message}
      </AlertDescription>
    </Alert>
  );
}