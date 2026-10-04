import React from 'react';
import { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | Institutional Store Management',
  description: 'Sign in to access the institutional store management system.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-warm-bg px-4 py-12">
      <LoginForm />
    </div>
  );
}
