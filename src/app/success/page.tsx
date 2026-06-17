import Link from 'next/link'

export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">✈️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re cleared for takeoff</h1>
        <p className="text-gray-500 mb-8">
          Solo Pilot unlocked. Unlimited scenarios, all airport classes, all phases of flight.
        </p>
        <Link
          href="/train"
          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          Start training →
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          Check your email for a receipt from Stripe.
        </p>
      </div>
    </main>
  )
}
