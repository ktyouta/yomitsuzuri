import { Errors, InitialLoading } from '@/components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AppErrorBoundary } from './app-error-boundary';
import { LoginUserProvider } from './login-user-provider';
import { AppRouter } from './router';
import { ThemeProvider } from './theme-provider';
import { VerifyApp } from './verify-app';

//React-Query用
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {

  return (
    <ThemeProvider>
      <BrowserRouter>
        <ErrorBoundary
          FallbackComponent={Errors}
        >
          <AppErrorBoundary>
            <Suspense
              fallback={<InitialLoading />}
            >
              <QueryClientProvider
                client={queryClient}
              >
                <ToastContainer
                  position="top-center"
                  autoClose={3000}
                />
                <VerifyApp>
                  {({ user }) => (
                    <LoginUserProvider
                      loginUser={user}
                    >
                      <AppRouter />
                    </LoginUserProvider>
                  )}
                </VerifyApp>
                {/* React-query devtool */}
                <ReactQueryDevtools
                  initialIsOpen={false}
                  buttonPosition='bottom-left'
                />
              </QueryClientProvider>
            </Suspense>
          </AppErrorBoundary>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  )
}