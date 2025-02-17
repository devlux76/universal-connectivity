import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from './alert';

interface ConnectionRetryEvent {
  attempt: number;
  error: string;
}

interface DialRetryEvent extends ConnectionRetryEvent {
  addr: string;
}

export function ConnectionAlert() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const handleConnectionRetry = (event: CustomEvent<ConnectionRetryEvent>) => {
      setAttempt(event.detail.attempt);
      setMessage(event.detail.error);
      setIsOpen(true);
    };

    const handleDialRetry = (event: CustomEvent<DialRetryEvent>) => {
      setAttempt(event.detail.attempt);
      setMessage(`Failed to dial ${event.detail.addr}: ${event.detail.error}`);
      setIsOpen(true);
    };

    window.addEventListener('libp2p:connection:retry', handleConnectionRetry as EventListener);
    window.addEventListener('libp2p:dial:retry', handleDialRetry as EventListener);

    return () => {
      window.removeEventListener('libp2p:connection:retry', handleConnectionRetry as EventListener);
      window.removeEventListener('libp2p:dial:retry', handleDialRetry as EventListener);
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