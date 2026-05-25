'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import MouseGlow from '@/components/effects/MouseGlow';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-white">
      {/* Mouse-follow glow — fixed so it tracks the viewport */}
      <MouseGlow />

      {/* Static ambient background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-gradient-to-br from-[#4f46e5] to-transparent rounded-full mix-blend-lighten blur-[120px] opacity-25 animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[1000px] h-[1000px] bg-gradient-to-tl from-[#06b6d4] to-transparent rounded-full mix-blend-lighten blur-[120px] opacity-20 animate-pulse-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[10%] right-[15%] w-64 h-64 bg-[#6366f1] rounded-full mix-blend-lighten blur-xl opacity-15 animate-float-1" />
        <div className="absolute bottom-[20%] left-[10%] w-72 h-72 bg-[#4f46e5] rounded-full mix-blend-lighten blur-xl opacity-15 animate-float-2" />
      </div>

      <Header />

      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
      </main>

      <Footer />
    </div>
  );
}
