'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, QrCode, MessageSquareText } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, className }) => {
  return (
    <motion.div
      className={`relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden ${className}`}
      whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10 flex flex-col items-start">
        <motion.div
          className="p-3 rounded-full bg-indigo-500/20 text-indigo-400 mb-4"
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Icon size={32} strokeWidth={1.5} />
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-300 text-base">{description}</p>
      </div>
    </motion.div>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Award,
      title: 'Credibility at Scale',
      description: 'Issue official digital certificates that are verifiable and trusted globally, enhancing your brand’s reputation.'
    },
    {
      icon: ShieldCheck,
      title: 'Tamper-Evident by Design',
      description: 'Every certificate has a unique, permanent verification link and QR code, so anyone can confirm it’s genuine in seconds — no accounts or downloads required.'
    },
    {
      icon: QrCode,
      title: 'Effortless Verification',
      description: 'Recipients can instantly verify certificates via unique QR codes or direct links, simplifying validation processes.'
    },
    {
      icon: MessageSquareText,
      title: 'Streamlined Management',
      description: 'Manage all your events and certificates from an intuitive dashboard, saving time and resources.'
    },
    // Add more features as needed
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
          Why Choose <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">Certhora</span>?
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
          {/* Example of a larger card, could be more dynamic */}
          <FeatureCard
            icon={QrCode}
            title="Customizable Designs"
            description="Tailor certificate templates to perfectly match your brand's aesthetic with our powerful editor."
            className="md:col-span-2"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
