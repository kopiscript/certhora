'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Header: React.FC = () => {
  return (
    <header className="absolute top-0 z-50 w-full px-4 py-5 md:px-8">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/certhoralogo.svg"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0"
          />
          <span className="text-white font-bold text-lg tracking-tight">Certhora</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-full transition-colors duration-200"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
