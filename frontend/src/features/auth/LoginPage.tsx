import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { LoginRequest } from '@/types';

interface ApiErrorResponse {
  error?: { message?: string };
  detail?: string;
}

function loginErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const responseMessage =
      error.response?.data?.error?.message ?? error.response?.data?.detail;
    if (responseMessage) return responseMessage;
    if (!error.response) {
      return 'Unable to reach the API. Check that the backend is running and the API URL is correct.';
    }
  }
  return error instanceof Error ? error.message : 'Invalid email or password';
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginRequest) => {
    setIsLoading(true);
    try {
      await login(values);
      success('Welcome back!', 'Successfully signed in to KaryaIQ.');
      navigate('/tasks');
    } catch (err: unknown) {
      toastError('Authentication Failed', loginErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1868DB] flex flex-col justify-between text-white selection:bg-white selection:text-[#1868DB]">
      {/* Top Navbar */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <BrandLogo light />

        <div className="text-xs text-white/90">
          <span>Need an account? </span>
          <Link
            to="/register"
            className="font-bold text-white underline underline-offset-4 hover:text-amber-300 transition-colors ml-1"
          >
            Sign up free
          </Link>
        </div>
      </header>

      {/* Main Content: Split Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 sm:py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Hero & Form (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Next-Gen Task Intelligence</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Log in to your workspace
              </h1>
              <p className="text-sm text-white/80 mt-2 leading-relaxed">
                Coordinate teams, manage projects, and supercharge issue resolution with AI.
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white text-[#172B4D] rounded-xl p-6 sm:p-7 shadow-2xl border border-white/20">
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="Work email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
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
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    Log In
                  </Button>
                </div>
              </form>

              <div className="mt-5 pt-4 border-t border-[#EBECF0] text-center text-xs text-[#6B778C]">
                <span>Don't have an account? </span>
                <Link
                  to="/register"
                  className="font-bold text-[#1868DB] hover:underline"
                >
                  Create one now
                </Link>
              </div>
            </div>
          </div>

          {/* Right Preview Card (7 cols) - Inspired by Jira Board preview */}
          <div className="hidden lg:flex lg:col-span-7 flex-col gap-4">
            <div className="bg-white/95 text-[#172B4D] rounded-xl shadow-2xl border border-white/40 p-6 backdrop-blur-md">
              {/* Fake UI Browser Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EBECF0]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-[#6B778C] ml-2">
                    KaryaIQ Board • Sprint 42
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#1868DB] font-semibold">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Real-time Sync Active</span>
                </div>
              </div>

              {/* Sample Task Board Preview Grid */}
              <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                {/* Column 1 */}
                <div className="bg-[#F4F5F7] rounded-lg p-2.5 border border-[#DFE1E6] flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-[#42526E] uppercase">TO DO</span>
                  <div className="bg-white p-2.5 rounded shadow-xs border border-[#DFE1E6]">
                    <span className="text-[10px] font-bold text-[#1868DB]">TASK-104</span>
                    <p className="font-semibold text-[#172B4D] mt-0.5">Integrate JWT auth token rotation</p>
                  </div>
                  <div className="bg-white p-2.5 rounded shadow-xs border border-[#DFE1E6]">
                    <span className="text-[10px] font-bold text-[#1868DB]">TASK-105</span>
                    <p className="font-semibold text-[#172B4D] mt-0.5">Set up WebSocket live sync</p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="bg-[#F4F5F7] rounded-lg p-2.5 border border-[#DFE1E6] flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-[#0747A6] uppercase">IN PROGRESS</span>
                  <div className="bg-white p-2.5 rounded shadow-xs border border-blue-200">
                    <span className="text-[10px] font-bold text-[#1868DB]">TASK-98</span>
                    <p className="font-semibold text-[#172B4D] mt-0.5">AI natural language task parser</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Powered</span>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="bg-[#F4F5F7] rounded-lg p-2.5 border border-[#DFE1E6] flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-[#006644] uppercase">DONE</span>
                  <div className="bg-white p-2.5 rounded shadow-xs border border-emerald-200">
                    <span className="text-[10px] font-bold text-[#1868DB]">TASK-92</span>
                    <p className="font-semibold text-[#172B4D] mt-0.5">FastAPI & PostgreSQL backend</p>
                    <div className="mt-1 text-[10px] text-emerald-700 font-semibold">✓ 74 Tests Passing</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-3 text-white/90 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Role-Based Permissions</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Natural Language</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-200" />
                <span>WebSocket Live Events</span>
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
