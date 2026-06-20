'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MouseGlow from '@/components/effects/MouseGlow';
import { TIERS } from '@/lib/tiers';

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-white">
      <MouseGlow />

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-gradient-to-br from-[#4f46e5] to-transparent rounded-full mix-blend-lighten blur-[120px] opacity-25 animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[1000px] h-[1000px] bg-gradient-to-tl from-[#06b6d4] to-transparent rounded-full mix-blend-lighten blur-[120px] opacity-20 animate-pulse-slow" style={{ animationDelay: '3s' }} />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-4 drop-shadow-lg">
            Simple, Transparent <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">Pricing</span>
          </h1>
          <p className="text-center text-gray-400 max-w-2xl mx-auto mb-16">
            Pick a plan that fits how many certificates you issue. Upgrade or downgrade anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.key}
                  className={`relative p-7 rounded-3xl border bg-white/5 backdrop-blur-md flex flex-col text-left transition-all duration-300 ${
                    tier.badge ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' : 'border-white/10'
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute top-4 right-4 px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">
                      {tier.badge}
                    </span>
                  )}

                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: tier.dimColor, border: `1px solid ${tier.borderColor}` }}
                  >
                    <Icon size={16} style={{ color: tier.color }} />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extrabold text-white">{tier.priceLabel}</span>
                    <span className="text-sm text-gray-400">{tier.priceSub}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-6">
                    {tier.quota === Infinity ? 'Unlimited certificates' : `${tier.quota.toLocaleString()} certificates / month`}
                  </p>

                  <ul className="text-left w-full space-y-2.5 mb-7 flex-grow">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check size={14} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={tier.key === 'ENTERPRISE' ? 'mailto:sales@certhora.com' : '/signup'} className="w-full">
                    <button
                      className="w-full py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:opacity-90"
                      style={{
                        background: tier.badge ? `linear-gradient(90deg, ${tier.color}, ${tier.color}cc)` : 'rgba(255,255,255,0.1)',
                        border: tier.badge ? 'none' : '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                      }}
                    >
                      {tier.key === 'ENTERPRISE' ? 'Contact Sales' : tier.key === 'FREE' ? 'Get Started' : 'Upgrade'}
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-500 mt-12">
            All plans include SSL encryption, 99.9% uptime SLA, and standard support. Payments processed securely via FPX / card.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
