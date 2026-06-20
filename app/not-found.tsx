import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-white flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-400 tracking-widest mb-3">404</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Page not found</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-full transition-colors duration-200"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
