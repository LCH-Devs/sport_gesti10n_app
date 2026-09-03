import {
  BuildingLibraryIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "@/lib/useTranslation";

const features = [
  {
    icon: BuildingLibraryIcon,
    title: "clubManagement",
    description: "clubDesc",
  },
  {
    icon: UserGroupIcon,
    title: "memberManagement",
    description: "memberDesc",
  },
  {
    icon: CalendarIcon,
    title: "eventScheduling",
    description: "eventDesc",
  },
  {
    icon: DocumentTextIcon,
    title: "newsUpdates",
    description: "newsDesc",
  },
  {
    icon: ChartBarIcon,
    title: "analytics",
    description: "analyticsDesc",
  },
  {
    icon: SparklesIcon,
    title: "integrations",
    description: "integrationsDesc",
  },
];

export function FeaturesGrid() {
  const { t } = useTranslation();
  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          {t("landing.features")}
        </h2>
        <p className="text-lg text-slate-600">{t("landing.description")}</p>
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
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t(`landing.${feature.title}`)}
              </h3>
              <p className="text-slate-600">
                {t(`landing.${feature.description}`)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
