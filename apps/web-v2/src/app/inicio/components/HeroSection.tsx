export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          Manage Your Sports Clubs Like a Pro
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
          Streamline team management, track events, manage members, and grow your sports organization efficiently.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#contacto"
            className="px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-lg"
          >
            Start Free Trial
          </a>
          <a
            href="#contacto"
            className="px-8 py-3 bg-white border-2 border-slate-300 text-slate-900 rounded-md font-medium hover:bg-slate-50 transition-colors text-lg"
          >
            Watch Demo
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 pt-20 border-t border-slate-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
          <p className="text-slate-600">Sports Organizations</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
          <p className="text-slate-600">Active Members</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
          <p className="text-slate-600">Events Managed</p>
        </div>
      </div>
    </section>
  );
}
