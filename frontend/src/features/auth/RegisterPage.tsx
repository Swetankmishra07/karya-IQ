import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { UserRole } from '@/types';

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  demoRegistrationCode: string;
}

interface ApiErrorResponse {
  error?: { message?: string };
  detail?: string;
}

function registrationErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return error instanceof Error ? error.message : 'Registration failed.';
  }

  const responseMessage = error.response?.data?.error?.message ?? error.response?.data?.detail;
  if (responseMessage) return responseMessage;
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'The request timed out. Check that the backend and database are available, then try again.';
  }
  if (!error.response) {
    return 'Unable to reach the API. Check the backend connection and try again.';
  }
  return error.message || 'Registration failed.';
}

export const RegisterPage: React.FC = () => {
  const { register: registerUser, login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'member',
      demoRegistrationCode: '',
    },
  });

  const passwordValue = watch('password');
  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    let accountCreated = false;
    try {
      if (import.meta.env.DEV) {
        console.log(
          '[Registration] Validation passed. Initiating API call for username:',
          values.username.trim(),
          'email:',
          values.email.trim()
        );
      }
      // Step 1: Register user profile in backend
      await registerUser({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        ...(values.role !== 'member'
          ? { demo_registration_code: values.demoRegistrationCode }
          : {}),
      });
      accountCreated = true;

      if (import.meta.env.DEV) {
        console.log('[Registration] Registration successful. Initiating login...');
      }

      // Step 2: Automatically authenticate and set session
      await login({
        email: values.email.trim(),
        password: values.password,
      });

      if (import.meta.env.DEV) {
        console.log('[Registration] Login successful. Navigating to /tasks');
      }

      success('Welcome to KaryaIQ!', 'Your account has been created successfully.');
      navigate('/tasks');
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('[Registration] Registration flow caught error:', err);
      }
      toastError(
        accountCreated ? 'Account Created, Sign-in Failed' : 'Registration Failed',
        accountCreated
          ? `Your account was created. Sign in with your new credentials. ${registrationErrorMessage(err)}`
          : registrationErrorMessage(err),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (import.meta.env.DEV) {
      console.log('[Registration] Form submit event received. Running client-side validation...');
    }
    return handleSubmit(
      onSubmit,
      (fieldErrors) => {
        if (import.meta.env.DEV) {
          console.warn(
            '[Registration] Client-side validation failed for fields:',
            Object.keys(fieldErrors)
          );
        }
      }
    )(e);
  };

  return (
    <div className="min-h-screen bg-[#1868DB] flex flex-col justify-between text-white selection:bg-white selection:text-[#1868DB]">
      {/* Top Navbar */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <BrandLogo light />

        <div className="text-xs text-white/90">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="font-bold text-white underline underline-offset-4 hover:text-amber-300 transition-colors ml-1"
          >
            Log in
          </Link>
        </div>
      </header>

      {/* Main Content: Split Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 sm:py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Hero & Form (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI-Powered Project Management</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Get started with KaryaIQ
              </h1>
              <p className="text-sm text-white/80 mt-1.5 leading-relaxed">
                Join thousands of engineers and managers accelerating sprint execution.
              </p>
            </div>

            {/* Registration Card */}
            <div className="bg-white text-[#172B4D] rounded-xl p-6 shadow-2xl border border-white/20">
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-3.5">
                <Input
                  label="Username"
                  required
                  autoComplete="username"
                  placeholder="e.g. alex_dev"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.username?.message}
                  {...register('username', {
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' },
                    maxLength: { value: 50, message: 'Username must be 50 characters or less' },
                  })}
                />

                <Input
                  label="Work email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  helperText="Using a work email helps find teammates and boost collaboration."
                  {...register('email', {
                    required: 'Work email is required',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    maxLength: { value: 72, message: 'Password must be 72 characters or less' },
                  })}
                />

                <Input
                  label="Confirm password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === passwordValue || 'Passwords do not match',
                  })}
                />

                <div className="flex w-full flex-col gap-1.5 text-left">
                  <label
                    htmlFor="registration-role"
                    className="text-xs font-semibold text-[#42526E]"
                  >
                    Select Account Role
                  </label>
                  <select
                    id="registration-role"
                    aria-label="Select Account Role"
                    className="w-full rounded-md border border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 text-sm text-[#172B4D] transition-all focus:border-[#1868DB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1868DB]/20"
                    {...register('role')}
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-amber-700">
                    Public signups are Members. Manager and Admin roles require the backend's
                    development-only demo setting and a valid registration code.
                  </p>
                </div>
                {selectedRole !== 'member' && (
                  <Input
                    label="Demo registration code"
                    type="password"
                    required
                    autoComplete="off"
                    placeholder="Enter the code provided for this demo"
                    error={errors.demoRegistrationCode?.message}
                    {...register('demoRegistrationCode', {
                      required: 'A demo registration code is required for this role',
                    })}
                  />
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    Sign up
                  </Button>
                </div>
              </form>

              <div className="mt-4 pt-3 border-t border-[#EBECF0] text-center text-xs text-[#6B778C]">
                <span>Already have an account? </span>
                <Link to="/login" className="font-bold text-[#1868DB] hover:underline">
                  Log in
                </Link>
              </div>
            </div>
          </div>

          {/* Right Preview Showcase (7 cols) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col gap-6 pl-4">
            <div className="bg-white/95 text-[#172B4D] rounded-xl shadow-2xl border border-white/40 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-[#EBECF0]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#172B4D]">
                    Readiness Checker & AI Advisor
                  </span>
                </div>
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  All Systems Online
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>AI Natural Language Task Generator</span>
                  </div>
                  <p className="text-blue-800 text-[11px] leading-relaxed">
                    Type instructions in plain English and let AI draft title, description,
                    priority, and milestones directly into your database.
                  </p>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 font-bold text-purple-900 mb-1">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Role-Based Access Control</span>
                  </div>
                  <p className="text-purple-800 text-[11px] leading-relaxed">
                    Admin, Manager, and Member permissions backed by SQLAlchemy ORM and Alembic
                    migrations with audit logs on every action.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 mb-1">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Real-Time WebSocket Sync</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Live updates for comments, task modifications, and notifications with zero
                    manual refreshing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/10 text-center text-xs text-white/70">
        KaryaIQ • AI-Powered Collaborative Work Management
      </footer>
    </div>
  );
};
