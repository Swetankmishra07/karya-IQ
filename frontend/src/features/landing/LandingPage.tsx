import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  Circle,
  Layers3,
  ListTodo,
  Menu,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Task Creation',
    description:
      'Turn a natural-language prompt into a structured task draft your team can review and refine.',
  },
  {
    icon: MessageSquareText,
    title: 'Intelligent Task Summaries',
    description:
      'Get a concise summary of task details and discussion to quickly understand what matters.',
  },
  {
    icon: Layers3,
    title: 'Collaborative Project Management',
    description:
      'Bring projects, tasks, teams, and responsibilities together in one shared workspace.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access Control',
    description:
      'Admin, Manager, and Member permissions are enforced by the application backend.',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description:
      'WebSocket events keep relevant task, comment, and notification changes in sync.',
  },
  {
    icon: Bell,
    title: 'Notifications and Activity Tracking',
    description:
      'Follow task activity and get notified about updates that need your attention.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Organize',
    description: 'Set up your workspace, projects, and team.',
    icon: Layers3,
  },
  {
    number: '02',
    title: 'Execute',
    description: 'Create tasks, assign responsibilities, and track progress.',
    icon: ListTodo,
  },
  {
    number: '03',
    title: 'Improve',
    description: 'Use available AI assistance and project insights to make work more efficient.',
    icon: Activity,
  },
];

const roles = [
  {
    title: 'Admin',
    description: 'Manage users and workspace settings according to your permissions.',
    icon: ShieldCheck,
  },
  {
    title: 'Manager',
    description: 'Coordinate projects, assign tasks, and monitor progress.',
    icon: Layers3,
  },
  {
    title: 'Member',
    description: 'View and manage assigned work and collaborate with your team.',
    icon: Users,
  },
];

const previewTasks = [
  {
    title: 'Review onboarding flow',
    project: 'Website refresh',
    status: 'In progress',
    statusClass: 'bg-blue-50 text-blue-700 ring-blue-100',
    priority: 'High',
    priorityClass: 'text-rose-600',
    initials: 'AM',
    avatarClass: 'bg-violet-100 text-violet-700',
    due: 'Today',
  },
  {
    title: 'Prepare launch checklist',
    project: 'Product launch',
    status: 'Pending',
    statusClass: 'bg-amber-50 text-amber-700 ring-amber-100',
    priority: 'Medium',
    priorityClass: 'text-amber-600',
    initials: 'JL',
    avatarClass: 'bg-sky-100 text-sky-700',
    due: 'Oct 22',
  },
  {
    title: 'Share research findings',
    project: 'Customer research',
    status: 'To do',
    statusClass: 'bg-slate-100 text-slate-600 ring-slate-200',
    priority: 'Low',
    priorityClass: 'text-slate-500',
    initials: 'RK',
    avatarClass: 'bg-emerald-100 text-emerald-700',
    due: 'Oct 24',
  },
];

const navigation = [
  { label: 'Product', href: '#product-preview' },
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'About', href: '#about' },
];

const currentYear = new Date().getFullYear();

export const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-white text-[#14213D]">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#top" aria-label="KaryaIQ home" onClick={closeMenu}>
            <BrandLogo />
          </a>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-[#14213D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Get Started
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:hidden"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg md:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-lg bg-[#1D4ED8] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#1E40AF]"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section id="top" className="overflow-hidden bg-[#F8FAFC]">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 lg:py-24">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-800 shadow-sm">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                AI-powered collaborative work management
              </div>
              <h1 className="text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.055em] text-[#14213D] sm:text-6xl lg:text-[4rem]">
                Intelligence That Moves Work{' '}
                <span className="text-[#2563EB]">Forward.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Bring your projects, people, and priorities together in one intelligent workspace.
                KaryaIQ helps teams plan work, coordinate effortlessly, and turn ideas into
                measurable progress.
              </p>
              <p className="mt-3 text-sm font-medium text-slate-500">
                Plan smarter. Collaborate seamlessly. Deliver exceptional results.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#1E40AF] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Explore Features
                </a>
              </div>
              <div className="mt-7 flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                One workspace. Clear priorities. Better collaboration.
              </div>
            </div>

            <div id="product-preview" className="relative mx-auto w-full max-w-[690px] scroll-mt-28">
              <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-blue-100/70 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-44 w-44 rounded-full bg-indigo-100/70 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_80px_-28px_rgba(15,23,42,0.28)]">
                <div className="flex h-12 items-center gap-2 border-b border-slate-200 bg-white px-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <div className="ml-3 flex h-7 flex-1 items-center rounded-md bg-slate-50 px-3 text-[10px] text-slate-400 sm:text-xs">
                    workspace.karyaiq.app
                  </div>
                </div>
                <div className="grid min-h-[420px] grid-cols-[54px_1fr] sm:grid-cols-[170px_1fr]">
                  <aside className="border-r border-slate-200 bg-slate-50/80 px-2 py-4 sm:px-3">
                    <div className="mb-6 flex items-center justify-center gap-2 sm:justify-start">
                      <BrandLogo compact iconOnly />
                      <span className="hidden text-xs font-bold text-slate-800 sm:inline">Workspace</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 rounded-md bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-800 sm:justify-start">
                        <ListTodo className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">My tasks</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 rounded-md px-2 py-2 text-xs text-slate-500 sm:justify-start">
                        <Layers3 className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Projects</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 rounded-md px-2 py-2 text-xs text-slate-500 sm:justify-start">
                        <Users className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Team</span>
                      </div>
                    </div>
                    <div className="mt-8 hidden sm:block">
                      <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Your projects
                      </p>
                      <div className="space-y-3 px-2 text-xs text-slate-600">
                        <p className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-sm bg-violet-500" />
                          Website refresh
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                          Product launch
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-sm bg-amber-500" />
                          Customer research
                        </p>
                      </div>
                    </div>
                  </aside>

                  <div className="min-w-0 p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
                          Monday, October 19
                        </p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                          Good morning, Alex
                        </h2>
                      </div>
                      <span className="relative rounded-lg border border-slate-200 p-2 text-slate-500">
                        <Bell className="h-4 w-4" aria-hidden="true" />
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-[10px] text-slate-500 sm:text-xs">Open tasks</p>
                        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">12</p>
                        <p className="mt-1 text-[10px] text-emerald-700">3 due this week</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-[10px] text-slate-500 sm:text-xs">In progress</p>
                        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">08</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-2/3 rounded-full bg-blue-600" />
                        </div>
                      </div>
                      <div className="col-span-2 rounded-xl border border-slate-200 p-3 sm:col-span-1">
                        <p className="text-[10px] text-slate-500 sm:text-xs">Projects</p>
                        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">04</p>
                        <div className="mt-1 flex -space-x-1.5">
                          {['bg-violet-200', 'bg-sky-200', 'bg-emerald-200'].map((color, index) => (
                            <span
                              key={color}
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${color} text-[8px] font-bold text-slate-700`}
                              aria-label={`Team member ${index + 1}`}
                            >
                              {['A', 'J', 'R'][index]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3 sm:px-4">
                        <div>
                          <h3 className="text-xs font-semibold text-slate-800 sm:text-sm">My tasks</h3>
                          <p className="mt-0.5 text-[10px] text-slate-400">Your team&apos;s next steps</p>
                        </div>
                        <span className="rounded-md border border-slate-200 p-1.5 text-slate-500">
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {previewTasks.map((task) => (
                          <div key={task.title} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center sm:px-4">
                            <div className="flex min-w-0 items-start gap-2">
                              <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-medium text-slate-800 sm:text-xs">
                                  {task.title}
                                </p>
                                <p className="mt-0.5 truncate text-[9px] text-slate-400 sm:text-[10px]">
                                  {task.project}
                                </p>
                              </div>
                            </div>
                            <span className={`hidden rounded-full px-2 py-1 text-[9px] font-medium ring-1 ring-inset sm:inline-flex ${task.statusClass}`}>
                              {task.status}
                            </span>
                            <span className={`hidden text-[10px] font-medium sm:block ${task.priorityClass}`}>
                              {task.priority}
                            </span>
                            <span className="flex items-center justify-end gap-1.5 text-[9px] text-slate-500 sm:text-[10px]">
                              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${task.avatarClass}`}>
                                {task.initials}
                              </span>
                              <span className="hidden sm:inline">{task.due}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-800 sm:text-xs">AI task draft</p>
                        <p className="truncate text-[9px] text-slate-500 sm:text-[10px]">
                          Turn a prompt into a task your team can refine
                        </p>
                      </div>
                      <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-blue-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-blue-700">One connected workspace</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#14213D] sm:text-4xl">
                Everything your team needs to make progress
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Bring everyday execution and thoughtful AI assistance into one clear, collaborative flow.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.28)]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 border-y border-slate-200 bg-[#F8FAFC] px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-blue-700">Built around the way teams work</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#14213D] sm:text-4xl">
                Plan smarter. Collaborate seamlessly. Deliver exceptional results.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                KaryaIQ brings projects, tasks, teams, and AI-powered workflows together in one
                intelligent workspace. Plan projects, assign responsibilities, track progress, and
                help your team deliver better results.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map(({ number, title, description, icon: Icon }) => (
                <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-wide text-blue-700">{number}</span>
                    <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="solutions" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-blue-700">Clear responsibilities, shared momentum</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#14213D] sm:text-4xl">
                A role for everyone on your team
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Each role has the access it needs, with permissions enforced by the backend.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {roles.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-2xl border border-slate-200 p-6 sm:p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-24">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#14213D] px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="mx-auto max-w-2xl">
              <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-200">
                <Check className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Ready to Move Work Forward?
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Bring your team, tasks, and ideas together in one intelligent workspace.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#14213D] transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#14213D]"
              >
                Get Started with KaryaIQ
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <a href="#top" aria-label="KaryaIQ home">
              <BrandLogo />
            </a>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              KaryaIQ brings projects, tasks, teams, and AI-powered workflows together in one intelligent workspace.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Product</h2>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
              <a className="hover:text-blue-700" href="#product-preview">Product preview</a>
              <a className="hover:text-blue-700" href="#features">Features</a>
              <a className="hover:text-blue-700" href="#solutions">Team roles</a>
              <a className="hover:text-blue-700" href="#about">How it works</a>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Your workspace</h2>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
              <Link className="hover:text-blue-700" to="/login">Sign In</Link>
              <Link className="hover:text-blue-700" to="/register">Get Started</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-9 max-w-7xl border-t border-slate-100 pt-5 text-xs text-slate-400">
          © {currentYear} KaryaIQ. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
