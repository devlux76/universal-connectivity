import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from './alert';

export function ConnectionAlert() {
  const [state, setState] = useState<AlertState>({ show: false, details: null })

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
    <>
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          <Transition
            show={state.show}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {state.details?.isRetry ? (
                      <XCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                    ) : (
                      <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">
                      {state.details?.isRetry
                        ? `Connection attempt ${state.details.attempt} failed`
                        : 'Connection successful!'}
                    </p>
                    {state.details?.error && (
                      <p className="mt-1 text-sm text-gray-500">{state.details.error}</p>
                    )}
                    {state.details?.addr && (
                      <p className="mt-1 text-sm text-gray-500">Address: {state.details.addr}</p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-shrink-0">
                    <button
                      type="button"
                      className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setState({ show: false, details: null })}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  )
}