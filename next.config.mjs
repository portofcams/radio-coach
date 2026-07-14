/** @type {import('next').NextConfig} */
// BUILD_TARGET=ios (set by scripts/build-ios.sh) produces a static export
// bundled into the Capacitor iOS app instead of the SSR server the website
// runs on. See scripts/build-ios.sh for what gets excluded/rewritten.
const isIosExport = process.env.BUILD_TARGET === 'ios';

const nextConfig = {
  output: isIosExport ? 'export' : 'standalone',
  // wilco.binnacleai.com is the pre-rebrand domain; clearsparradio.binnacleai.com
  // is canonical (every page already emits rel=canonical pointing there). Both
  // currently serve identical content from the same container -- this finishes
  // the migration at the app level instead of touching Cloudflare/NPM routing,
  // since a routing-layer change on this exact infra caused an outage this week.
  // Host-based redirects need the SSR server, so skip for the iOS static export.
  ...(isIosExport ? {} : {
    async redirects() {
      return [
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'wilco.binnacleai.com' }],
          destination: 'https://clearsparradio.binnacleai.com/:path*',
          permanent: true,
        },
      ]
    },
  }),
};

export default nextConfig;
