'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserPlus, CalendarPlus, LayoutTemplate, Users, Zap, Send, BadgeCheck,
  ChevronDown, ArrowRight,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MouseGlow from '@/components/effects/MouseGlow';

const ease = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your organizer account',
    description:
      'Sign up free — no card required. Every account starts on the Free tier with 40 certificates a month.',
  },
  {
    icon: CalendarPlus,
    title: 'Create an event',
    description:
      'Give it a name, dates, description, and the skills it covers. You can duplicate a past event to reuse its setup.',
  },
  {
    icon: LayoutTemplate,
    title: 'Design the certificate',
    description:
      'Upload your own background (PNG/JPEG/WEBP) or use the default design. Drag the name, QR code, and any extra text to position them exactly where you want.',
  },
  {
    icon: Users,
    title: 'Add participants',
    description:
      'Add the attendees who should receive a certificate — each one gets a unique certificate ID reserved for them right away.',
  },
  {
    icon: Zap,
    title: 'Generate certificates',
    description:
      'One click renders a personalized certificate image with a verification QR code for every participant, counted against your monthly quota.',
  },
  {
    icon: Send,
    title: 'Send them out',
    description:
      'Click Send Emails to deliver each participant a link to their certificate. Any that fail to send can simply be sent again.',
  },
  {
    icon: BadgeCheck,
    title: 'Certificates get verified — for free',
    description:
      'Every certificate has a public, permanent link with its own QR code, so anyone — an employer, a recruiter — can confirm it’s real without an account.',
  },
];

const FAQ = [
  {
    q: 'How many certificates can I issue?',
    a: 'The Free plan includes 40 certificates a month at no cost. Starter and Pro plans raise that limit — see the Pricing page for the full breakdown. Your quota resets monthly and only counts certificates that have actually been generated.',
  },
  {
    q: 'Do participants get emailed automatically?',
    a: 'No — you stay in control. After certificates are generated, you click "Send Emails" (per event, or for a selection of participants) to deliver them. This also means you can double-check everything before anything goes out.',
  },
  {
    q: 'What if an email fails to send?',
    a: 'It happens occasionally with any email provider. Failed sends are clearly marked in your participants list, and you can just click send again — no need to re-generate the certificate.',
  },
  {
    q: 'Can I use my own certificate design?',
    a: 'Yes. Upload a background image (PNG, JPEG, or WEBP) and use the drag-and-drop editor to place the participant name, QR code, and any extra text exactly where you want them. If you skip this, a clean default design is used automatically.',
  },
  {
    q: 'How does certificate verification work?',
    a: 'Every certificate gets its own public page and QR code. Anyone with the link can view it and confirm the participant name, event, and issue date — no login required. Each view is counted so you can see engagement.',
  },
  {
    q: 'What happens when a certificate expires?',
    a: 'If you set an expiry date on an event, the public certificate page clearly shows an "Expired" status once that date passes — the certificate remains viewable, just marked accordingly.',
  },
  {
    q: 'Can attendees leave feedback on an event?',
    a: 'Yes — the certificate page includes an optional star rating and comment form, and responses show up on your event dashboard.',
  },
];

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10 py-5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <span className="text-[15px] font-medium text-white">{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.25, ease }}
          className="text-sm text-white/50 leading-relaxed mt-3 pr-8 overflow-hidden"
        >
          {a}
        </motion.p>
      )}
    </div>
  );
}

export default function HowToUsePage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-white">
      <MouseGlow />

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-gradient-to-br from-[#4f46e5] to-transparent rounded-full mix-blend-lighten blur-[120px] opacity-25 animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[1000px] h-[1000px] bg-gradient-to-tl from-[#06b6d4] to-transparent rounded-full mix-blend-lighten blur-[120px] opacity-20 animate-pulse-slow" style={{ animationDelay: '3s' }} />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-24 px-4 md:px-8">
        {/* ── Intro ─────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg"
          >
            How <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">Certhora</span> works
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.08 }}
            className="text-gray-400 leading-relaxed"
          >
            From event setup to a verified certificate in someone&apos;s inbox — here&apos;s the whole flow, start to finish.
          </motion.p>
        </div>

        {/* ── Steps ─────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto mb-28">
          <div className="relative">
            <div className="absolute left-[23px] top-2 bottom-2 w-px bg-white/10" aria-hidden />
            <div className="flex flex-col gap-2">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, ease, delay: i * 0.04 }}
                    className="relative flex gap-5 py-5"
                  >
                    <div className="relative z-10 w-12 h-12 rounded-full bg-[#0b0f1a] border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-indigo-400" strokeWidth={1.75} />
                    </div>
                    <div className="pt-1.5">
                      <p className="text-xs font-semibold tracking-wide text-indigo-400/70 uppercase mb-1">
                        Step {i + 1}
                      </p>
                      <h3 className="text-lg font-semibold text-white mb-1.5">{step.title}</h3>
                      <p className="text-[15px] text-gray-400 leading-relaxed max-w-xl">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease }}
            className="text-3xl font-extrabold text-center mb-2"
          >
            Frequently asked questions
          </motion.h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            Can&apos;t find what you&apos;re looking for?{' '}
            <a href="mailto:admin@certhora.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Email us
            </a>
            .
          </p>

          <div>
            {FAQ.map(item => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease }}
          className="max-w-2xl mx-auto text-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md px-8 py-12"
        >
          <h3 className="text-2xl font-bold mb-2">Ready to issue your first certificate?</h3>
          <p className="text-gray-400 text-sm mb-7">Free to start. No credit card required.</p>
          <Link href="/signup">
            <button className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-colors duration-200">
              Get started free
              <ArrowRight size={14} />
            </button>
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
