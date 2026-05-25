'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface PriceCardProps {
  planName: string;
  price: string;
  billingCycle: string;
  features: string[];
  isFeatured?: boolean;
  ctaText: string;
  ctaLink: string;
}

const PricingCard: React.FC<PriceCardProps> = ({
  planName,
  price,
  billingCycle,
  features,
  isFeatured,
  ctaText,
  ctaLink,
}) => {
  return (
    <motion.div
      className={`relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center text-center overflow-hidden transition-all duration-300 ${isFeatured ? 'col-span-1 md:col-span-2 lg:col-span-1 border-indigo-500/50 shadow-lg shadow-indigo-500/20' : ''}`}
      whileHover={{ y: isFeatured ? -10 : -5, boxShadow: isFeatured ? "0 25px 50px rgba(79, 70, 229, 0.3)" : "0 15px 30px rgba(0,0,0,0.2)" }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {isFeatured && (
        <span className="absolute top-0 right-0 -mr-6 -mt-6 px-6 py-2 bg-indigo-600 text-white text-xs font-bold uppercase rounded-bl-lg transform rotate-45 origin-bottom-left">
          Most Popular
        </span>
      )}
      <h3 className="text-2xl font-bold text-white mb-4">{planName}</h3>
      <div className="flex items-baseline mb-6">
        <span className="text-5xl font-extrabold text-white">{price}</span>
        <span className="text-xl text-gray-400">/{billingCycle}</span>
      </div>
      <p className="text-gray-300 mb-8 flex-grow">Perfect for {planName} users.</p>

      <ul className="text-left w-full space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-200">
            <Check className="w-5 h-5 text-indigo-400 mr-3 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link href={ctaLink} className="w-full mt-auto">
        <motion.button
          className={`w-full py-3 rounded-full text-white font-semibold transition-all duration-300 ${isFeatured ? 'bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] hover:shadow-lg hover:shadow-indigo-500/50' : 'bg-white/10 border border-white/20 hover:bg-white/20'}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {ctaText}
        </motion.button>
      </Link>
    </motion.div>
  );
};

const PricingSection: React.FC = () => {
  const plans = [
    {
      planName: 'Starter',
      price: '$0',
      billingCycle: 'month',
      features: ['Up to 5 events', 'Basic analytics', 'Standard templates', 'Email support'],
      ctaText: 'Start Free',
      ctaLink: '/signup',
    },
    {
      planName: 'Pro',
      price: '$49',
      billingCycle: 'month',
      features: ['Unlimited events', 'Advanced analytics', 'Premium templates', 'Priority support', 'Custom branding', 'API access'],
      isFeatured: true,
      ctaText: 'Go Pro',
      ctaLink: '/signup',
    },
    {
      planName: 'Enterprise',
      price: 'Custom',
      billingCycle: '',
      features: ['All Pro features', 'Dedicated account manager', 'SLA', 'On-premise option', 'Custom integrations'],
      ctaText: 'Contact Sales',
      ctaLink: '/contact',
    },
  ];

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;