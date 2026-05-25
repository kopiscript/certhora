'use client';

import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "Certhora transformed our event's certificate issuance. It's incredibly intuitive and the verifiable credentials add immense value.",
    name: 'Jane Doe',
    title: 'Event Manager, Global Conferences',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Jane%20Doe&backgroundColor=b6e3f4',
  },
  {
    quote: "The platform's security features gave us peace of mind. No more worries about fraudulent certificates!",
    name: 'John Smith',
    title: 'CEO, Tech Innovators',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=John%20Smith&backgroundColor=c0aede',
  },
  {
    quote: "Beautiful designs and seamless verification. Certhora is a game-changer for digital credentials.",
    name: 'Alice Johnson',
    title: 'Head of Marketing, Creative Hub',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Alice%20Johnson&backgroundColor=d1d4f9',
  },
  {
    quote: "Our participants love the ease of accessing and sharing their certificates. Highly recommend Certhora!",
    name: 'Robert Brown',
    title: 'Program Director, EduTech Summit',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Robert%20Brown&backgroundColor=b6e3f4',
  },
  {
    quote: "Certhora's customization options allowed us to perfectly brand our certificates. Truly professional.",
    name: 'Emily White',
    title: 'Brand Strategist, Design Collective',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Emily%20White&backgroundColor=c0aede',
  },
];

const TestimonialCard: React.FC<{ t: typeof testimonials[0] }> = ({ t }) => (
  <div className="flex-shrink-0 w-80 md:w-96 h-full p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col">
    {/* Stars */}
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>

    {/* Quote */}
    <p className="text-gray-300 text-sm leading-relaxed flex-1">
      &ldquo;{t.quote}&rdquo;
    </p>

    {/* Author */}
    <div className="flex items-center gap-3 mt-5 pt-5 border-t border-white/8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full shrink-0" />
      <div>
        <p className="text-sm font-semibold text-white leading-tight">{t.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t.title}</p>
      </div>
    </div>
  </div>
);

const TestimonialsSection: React.FC = () => {
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="relative z-10 py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-14 text-center">
        <motion.p
          className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Testimonials
        </motion.p>
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          Hear From Our{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-500">
            Community
          </span>
        </motion.h2>
      </div>

      {/* Marquee — equal height via items-stretch, pauses on hover */}
      <div className="relative">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#030712] to-transparent z-10 pointer-events-none" />

        <div className="flex overflow-hidden py-2">
          <div className="flex items-stretch gap-5 animate-marquee hover:pause-marquee">
            {doubled.map((t, i) => (
              <TestimonialCard key={i} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
