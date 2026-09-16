import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
    "ws",
    "bcryptjs",
    "@aws-sdk/client-s3",
    "sharp",
    "@resvg/resvg-js",
  ],
  // @resvg/resvg-js (and sharp) ship platform-specific native binaries loaded via a
  // dynamic require() keyed off process.platform/arch — Next's build-time file tracer
  // can't statically detect that and may omit them from the deployed serverless
  // function, causing the native binding to silently fail at runtime. Force-include
  // every platform's binary so this doesn't depend on guessing the deploy target.
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/@resvg/resvg-js-linux-x64-gnu/**/*",
      "node_modules/@resvg/resvg-js-linux-x64-musl/**/*",
      "node_modules/@resvg/resvg-js-linux-arm64-gnu/**/*",
      "node_modules/@resvg/resvg-js-linux-arm64-musl/**/*",
      "node_modules/@resvg/resvg-js-darwin-x64/**/*",
      "node_modules/@resvg/resvg-js-darwin-arm64/**/*",
      "node_modules/sharp/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/certificate.php",
        destination: "/api/legacy-certificate",
      },
    ];
  },
};

export default nextConfig;
