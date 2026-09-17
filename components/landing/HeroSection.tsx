'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

const HeroSection: React.FC = () => {
  return (
    <section className="relative z-10 min-h-screen flex items-center px-6 md:px-12 lg:px-20 overflow-hidden">
      <div className="relative z-20 w-full max-w-7xl mx-auto pt-28 pb-20 grid grid-cols-1 lg:grid-cols-[0.85fr_1.3fr] gap-16 items-center">

        <div>
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.07 }}
            className="text-[clamp(2.1rem,4.6vw,3.4rem)] font-bold tracking-tight leading-[1.08] text-white mb-8"
          >
            The professional way to
            <br />
            issue digital certificates.
          </motion.h1>

          {/* Rule */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease, delay: 0.32 }}
            className="h-px bg-white/8 origin-left mb-8"
          />

          {/* Description + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.42 }}
            className="flex flex-col gap-8"
          >
            <p className="text-[13px] text-white/45 leading-relaxed max-w-xs">
              Certhora lets organizers issue, host, and verify tamper-proof certificates
              that attendees can share and employers can trust.
            </p>

            <div className="flex items-center gap-5 shrink-0">
              <Link href="/signup">
                <motion.button
                  className="px-7 py-2.5 rounded-full bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-colors duration-200"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  Get started free
                </motion.button>
              </Link>
              <Link href="/how-to-use">
                <motion.span
                  className="flex items-center gap-1.5 text-sm text-white/45 hover:text-white/75 transition-colors duration-200 cursor-pointer"
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  How it works
                  <ArrowRight size={13} />
                </motion.span>
              </Link>
            </div>
          </motion.div>

          {/* Feature row — true claims only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-14 pt-7 border-t border-white/5 flex flex-wrap gap-x-8 gap-y-3"
          >
            {[
              'Tamper-proof credentials',
              'Bulk issuance in seconds',
              'Publicly verifiable links',
              'Free to get started',
            ].map((item) => (
              <span key={item} className="flex items-center gap-2 text-[12px] text-white/30">
                <span className="w-1 h-1 rounded-full bg-indigo-500/60 shrink-0" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Product mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.25 }}
          className="relative"
        >
          {/* Ambient glow behind the mockup — desktop-only, blur() is expensive to paint on mobile GPUs */}
          <div className="hidden md:block absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full scale-75" />

          <motion.div
            whileHover={{ scale: 1.04, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative"
          >
            <Image
              src="/mockup-hero.png"
              alt="Certhora certificate verification page shown on laptop and phone"
              width={1672}
              height={941}
              priority
              sizes="(min-width: 1024px) 55vw, 90vw"
              className="w-full h-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

export default HeroSection;
