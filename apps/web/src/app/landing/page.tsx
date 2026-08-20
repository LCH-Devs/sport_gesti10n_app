import Link from 'next/link';
import { HeroSection } from './components/HeroSection';
import { FeaturesGrid } from './components/FeaturesGrid';
import { MapSection } from './components/MapSection';

export const metadata = {
  title: 'AthlletiCorp - Sports Club Management',
  description: 'Manage your sports clubs, teams, events, and members in one platform',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">AthlletiCorp</h1>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Grid */}
        <FeaturesGrid />

        {/* Map Section */}
        <MapSection />

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to manage your sports clubs?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Join hundreds of sports organizations using AthlletiCorp
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-lg"
          >
            Get Started
          </Link>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold mb-4">AthlletiCorp</h3>
                <p className="text-slate-400 text-sm">Sports management made simple</p>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-sm">Product</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><a href="#" className="hover:text-white">Features</a></li>
                  <li><a href="#" className="hover:text-white">Pricing</a></li>
                  <li><a href="#" className="hover:text-white">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-sm">Company</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><a href="#" className="hover:text-white">About</a></li>
                  <li><a href="#" className="hover:text-white">Blog</a></li>
                  <li><a href="#" className="hover:text-white">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-sm">Legal</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><a href="#" className="hover:text-white">Privacy</a></li>
                  <li><a href="#" className="hover:text-white">Terms</a></li>
                  <li><a href="#" className="hover:text-white">API Docs</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
              <p>&copy; 2024 AthlletiCorp. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
