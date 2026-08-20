import {
  BuildingLibraryIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: BuildingLibraryIcon,
    title: 'Club Management',
    description: 'Organize and manage multiple sports clubs, teams, and facilities in one place.',
  },
  {
    icon: UserGroupIcon,
    title: 'Member Management',
    description: 'Track player profiles, roles, fitness levels, and performance metrics.',
  },
  {
    icon: CalendarIcon,
    title: 'Event Scheduling',
    description: 'Plan and coordinate games, practices, tournaments, and events seamlessly.',
  },
  {
    icon: DocumentTextIcon,
    title: 'News & Updates',
    description: 'Share announcements, results, and stories with your community.',
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics & Reports',
    description: 'Track performance metrics and generate detailed reports for analysis.',
  },
  {
    icon: SparklesIcon,
    title: 'Smart Integrations',
    description: 'Connect with your favorite tools and automate workflows.',
  },
];

export function FeaturesGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
        <p className="text-lg text-slate-600">Everything you need to manage your sports organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="p-8 bg-white border border-slate-200 rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
