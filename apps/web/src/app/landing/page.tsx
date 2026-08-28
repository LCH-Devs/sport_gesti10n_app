"use client";

import { HeroSection } from "./components/HeroSection";
import { FeaturesGrid } from "./components/FeaturesGrid";
import { MapSection } from "./components/MapSection";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/useTranslation";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="scroll-auto min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">AthlletiCorp</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
              {t("landing.signIn")}
            </a>
          </div>
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

        <section
          id="contacto"
          className="max-w-xl mx-auto px-6 py-20 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {t("landing.contactTitle")}
          </h2>
          <p className="text-slate-600 mb-8">{t("landing.contactSubtitle")}</p>
          <form
            className="grid gap-3 text-left"
            action="mailto:hola@clubapp.com.ar"
            method="get"
          >
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactName")}
              <input
                name="name"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactClub")}
              <input
                name="club"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactEmail")}
              <input
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactMessage")}
              <textarea
                name="body"
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="mt-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              {t("landing.contactSend")}
            </button>
          </form>
          <p className="mt-4 text-sm text-slate-500">{t("landing.contactHint")}</p>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            {t("landing.ready")}
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            {t("landing.joinHundreds")}
          </p>
          <a
            href="#contacto"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-lg"
          >
            {t("landing.getStarted")}
          </a>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold mb-4">AthlletiCorp</h3>
                <p className="text-slate-400 text-sm">{t("landing.title")}</p>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-sm">Product</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Security
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-sm">Company</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-sm">Legal</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      API Docs
                    </a>
                  </li>
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
