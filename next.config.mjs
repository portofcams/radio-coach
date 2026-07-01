/** @type {import('next').NextConfig} */
// BUILD_TARGET=ios (set by scripts/build-ios.sh) produces a static export
// bundled into the Capacitor iOS app instead of the SSR server the website
// runs on. See scripts/build-ios.sh for what gets excluded/rewritten.
const nextConfig = {
  output: process.env.BUILD_TARGET === 'ios' ? 'export' : 'standalone',
};

export default nextConfig;
