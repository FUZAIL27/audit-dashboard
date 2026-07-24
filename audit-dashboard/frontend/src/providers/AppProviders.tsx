import { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './QueryProvider';
import { ToastProvider } from './ToastProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <QueryProvider>
        <ToastProvider>{children}</ToastProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}
