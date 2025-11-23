/**
 * A centralized utility for parsing various error types into user-friendly strings.
 * This helps avoid exposing technical details like "PostgrestError" to the end-user.
 * @param e - The error object, which can be of any type.
 * @returns A user-friendly error message string.
 */
export const parseError = (e: unknown): string => {
  // Default message
  let errorMessage = 'An unexpected error occurred. Please try again.';

  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    
    // Network errors (common in browsers)
    if (msg.includes('failed to fetch') || msg.includes('network request failed')) {
      return 'A network error occurred. Please check your internet connection and try again.';
    }
    
    // Supabase-specific errors
    if (msg.includes('jwt expired')) {
      return 'Your session has expired. Please sign out and sign in again.';
    }
    if (msg.includes('duplicate key value violates unique constraint')) {
        return 'This item already exists or the name is already taken.';
    }
    if (msg.includes('rls policy')) { // Row Level Security
        return 'You do not have permission to perform this action.';
    }

    // Return the original message if it's not too technical
    errorMessage = e.message;
  } else if (e && typeof e === 'object' && 'message' in e && typeof (e as any).message === 'string') {
    // Handle Supabase PostgREST errors which are objects like { message: '...', details: '...' }
    errorMessage = (e as any).message;
  } else if (typeof e === 'string' && e) {
    errorMessage = e;
  }
  
  // Sanitize the final message to prevent overly technical output
  if (errorMessage.includes('PostgrestError')) {
    return 'A database error occurred. Please contact support if the problem persists.';
  }

  return errorMessage;
};
