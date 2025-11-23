import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Use a class property to initialize state. This is a more modern and concise syntax that avoids constructor complexities and resolves the type errors.
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to the console for debugging
    console.error("Uncaught error:", error, errorInfo);
  }
  
  handleReload = () => {
      // Attempt a safe navigation back to the home page before reloading
      window.location.hash = '#/';
      window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      // Render a user-friendly fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-900 p-4 font-sans">
            <div className="text-center p-8 bg-white border border-red-200 rounded-lg shadow-md max-w-lg">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h1 className="text-2xl font-bold mt-4">Something went wrong</h1>
                <p className="mt-2 text-red-800">
                    We're sorry, but the application encountered an unexpected error.
                    Please try refreshing the page.
                </p>
                <button 
                    onClick={this.handleReload}
                    className="mt-6 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-all"
                >
                    Refresh Page
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
