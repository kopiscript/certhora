'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GitBranch, X } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 w-full py-12 px-4 md:px-8 border-t border-white/5 bg-[#030712] text-gray-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Image
              src="/certhoralogo.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0"
            />
            <span className="text-white font-bold text-base tracking-tight">Certhora</span>
          </Link>
          <p className="text-sm leading-relaxed">
            Issue and host secure digital certificates with credibility.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 text-sm">Product</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-white transition-colors duration-200 text-sm">Features</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors duration-200 text-sm">Pricing</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors duration-200 text-sm">Demo</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-white transition-colors duration-200 text-sm">About Us</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors duration-200 text-sm">Contact</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors duration-200 text-sm">Careers</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 text-sm">Resources</h3>
          <ul className="space-y-2 mb-6">
            <li><Link href="#" className="hover:text-white transition-colors duration-200 text-sm">Blog</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors duration-200 text-sm">Support</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors duration-200 text-sm">Docs</Link></li>
          </ul>
          <div className="flex gap-4">
            <a href="#" aria-label="GitHub" className="text-gray-400 hover:text-white transition-colors duration-200">
              <GitBranch size={18} />
            </a>
            <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors duration-200">
              <X size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 text-center text-sm text-gray-600">
        &copy; {new Date().getFullYear()} Certhora. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
