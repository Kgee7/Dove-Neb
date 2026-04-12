'use client';

// Re-export the ResetPasswordPage to handle legacy 'un-neat' links sent previously.
// This ensures that links pointing to /forgot-password/_auth/act still work.
import ResetPasswordPage from '@/app/reset-password/page';

export default ResetPasswordPage;
