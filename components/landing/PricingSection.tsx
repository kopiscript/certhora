'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { TIERS, type Tier } from '@/lib/tiers';

const PricingCard: React.FC<{ tier: Tier }> = ({ tier }) => {
  const Icon = tier.icon;
  return (
    <motion.div
      className={`relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center text-center overflow-hidden transition-all duration-300 ${tier.badge ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' : ''}`}
      whileHover={{ y: tier.badge ? -10 : -5, boxShadow: tier.badge ? "0 25px 50px rgba(79, 70, 229, 0.3)" : "0 15px 30px rgba(0,0,0,0.2)" }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {tier.badge && (
        <span className="absolute top-0 right-0 -mr-6 -mt-6 px-6 py-2 bg-indigo-600 text-white text-xs font-bold uppercase rounded-bl-lg transform rotate-45 origin-bottom-left">
          {tier.badge}
        </span>
      )}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
        style={{ background: tier.dimColor, border: `1px solid ${tier.borderColor}` }}
      >
        <Icon size={16} style={{ color: tier.color }} />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{tier.name}</h3>
      <div className="flex items-baseline mb-1">
        <span className="text-4xl font-extrabold text-white">{tier.priceLabel}</span>
        <span className="text-base text-gray-400 ml-1">{tier.priceSub}</span>
      </div>
      <p className="text-gray-500 text-xs mb-6">
        {tier.quota.toLocaleString()} certificates / month
      </p>

      <ul className="text-left w-full space-y-3 mb-8 flex-grow">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-center text-gray-200">
            <Check className="w-5 h-5 text-indigo-400 mr-3 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link href="/signup" className="w-full mt-auto">
        <motion.button
          className={`w-full py-3 rounded-full text-white font-semibold transition-all duration-300 ${tier.badge ? 'bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] hover:shadow-lg hover:shadow-indigo-500/50' : 'bg-white/10 border border-white/20 hover:bg-white/20'}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {tier.key === 'FREE' ? 'Start Free' : 'Upgrade'}
        </motion.button>
      </Link>
    </motion.div>
  );
};

const PricingSection: React.FC = () => {
  return (
    <section className="relative z-10 py-24 px-4 md:px-8 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-white text-center mb-16 drop-shadow-lg"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Simple, Transparent <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">Pricing</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 justify-center">
          {TIERS.map((tier) => (
            <PricingCard key={tier.key} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
