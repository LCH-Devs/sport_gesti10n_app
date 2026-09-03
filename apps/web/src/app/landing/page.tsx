"use client";

import { useState } from "react";
import { HeroSection } from "./components/HeroSection";
import { FeaturesGrid } from "./components/FeaturesGrid";
import { MapSection } from "./components/MapSection";
import { ContactSection } from "./components/ContactForm";
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
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">Kanri</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              {t("landing.signIn")}
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-8">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Grid */}
        <FeaturesGrid />

        {/* Map Section */}
        <MapSection />

        <ContactSection />

        {/* CTA Section */}
        {/*         <section className="max-w-7xl mx-auto px-6 py-8 text-center">
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
        </section> */}

        {/* Footer */}
        <footer className="relative z-20 block w-full bg-slate-900 py-12 text-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold mb-4">Kanri</h3>
                <p className="text-slate-400 text-sm">{t("landing.title")}</p>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-sm">Producto</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      Características
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Precios
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Seguridad
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-sm">Empresa</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      Nosotros
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Contacto
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-sm">Legal</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      Privacidad
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Términos
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Documentación de la API
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
              <p>&copy; 2026 Kanri. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
