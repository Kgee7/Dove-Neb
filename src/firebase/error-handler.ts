
import { FirebaseError } from 'firebase/app';

interface ToastOptions {
  variant: 'destructive';
  title: string;
  description: string;
}

type ToastFunction = (options: ToastOptions) => void;

/**
 * Type guard to check if an error is a FirebaseError.
 */
function isFirebaseError(error: any): error is FirebaseError {
  return error instanceof Error && 'code' in error && 'message' in error;
}

/**
 * A centralized error handler for Firebase errors.
 */
export function handleFirebaseError(error: any, toast?: ToastFunction) {
  let errorMessage = 'An unexpected error occurred. Please try again.';
  let errorTitle = 'Error';

  if (isFirebaseError(error)) {
    errorTitle = 'Firebase Error';
    // Handle specific Firebase errors
    switch (error.code) {
      case 'storage/retry-limit-exceeded':
        errorMessage = 'Network error. Please check your connection and try again.';
        break;
      case 'storage/unauthorized':
        errorMessage = 'Permission denied. You might not have access to this resource.';
        break;
      case 'storage/quota-exceeded':
        errorMessage = 'Storage quota has been exceeded. Please contact support.';
        break;
      // Add other specific error codes here
      default:
        errorMessage = `An unexpected Firebase error occurred: ${error.message}`;
    }
    console.error('Firebase Error:', error.code, error.message);
  } else {
    // Handle non-Firebase errors
    console.error('An unexpected error occurred:', error);
  }

  if (toast) {
    toast({
      variant: 'destructive',
      title: errorTitle,
      description: errorMessage,
    });
  }
}
