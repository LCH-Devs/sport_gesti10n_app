"use client";

import { HeroSection } from "./landing/components/HeroSection";
import { FeaturesGrid } from "./landing/components/FeaturesGrid";
import { MapSection } from "./landing/components/MapSection";
import { ContactSection } from "./landing/components/ContactForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/useTranslation";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">AthlletiCorp</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a href="/login" className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
              {t("landing.signIn")}
            </a>
          </div>
        </div>
      </header>
      <div className="pt-16">
        <HeroSection />
        <FeaturesGrid />
        <MapSection />
        <ContactSection />
      </div>
    </div>
  );
}
