'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative min-h-screen bg-[#030712] text-white flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-red-400 tracking-widest mb-3">500</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Something went wrong</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center justify-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-full transition-colors duration-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
