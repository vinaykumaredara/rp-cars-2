
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const response = isSignUp 
      ? await signUp({ email, password }) 
      : await signIn({ email, password });

    const { error: authError } = response;

    if (authError) {
       if (isSignUp) {
            if (authError.message.includes('User already registered')) {
              setError('An account with this email already exists. Please sign in instead.');
            } else {
              setError(authError.message || 'An unexpected error occurred during sign up.');
            }
        } else { // It's a sign-in attempt
            const errorMessage = authError.message.toLowerCase();
            if (errorMessage.includes('user not found') || errorMessage.includes('email not found')) {
                setError('Please create an account first, then log in to the website.');
            } else if (errorMessage.includes('invalid login credentials')) {
                setError('Invalid credentials');
            } else {
                setError(authError.message || 'An unexpected error occurred during sign in.');
            }
        }
    } else {
      // On any successful auth, close the modal.
      // Redirection for admin is handled by the AuthContext listener.
      onClose();
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
       setError(error.message || 'Failed to sign in with Google. Please try again.');
       setLoading(false);
    }
    // On success, Supabase redirects and AuthContext listener handles the session.
  };

  const closeModal = () => {
    // Reset state on close
    setEmail('');
    setPassword('');
    setError(null);
    setIsSignUp(false);
    setLoading(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto p-8 transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScale 0.3s forwards' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-charcoal">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}

        <form onSubmit={handleAuthAction}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              id="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition" />
          </div>
          <div className="mb-6">
            <label htmlFor="password"className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              id="password" 
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-all duration-300 shadow-sm hover:shadow-md mb-4 disabled:bg-opacity-50">
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="font-semibold text-primary hover:underline ml-1">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full py-3 flex items-center justify-center rounded-lg border border-gray-300 text-neutral-charcoal font-medium hover:bg-gray-50 transition-all duration-300 disabled:bg-gray-200">
           <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 36.131 44 30.561 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
          Continue with Google
        </button>
      </div>
       <style>
        {`
        @keyframes fadeInScale {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in-scale {
            animation: fadeInScale 0.3s forwards;
        }
        `}
       </style>
    </div>
  );
};

export default Modal;
