import { visualPanels } from "@/lib/demo-data";
import Image from "next/image";

export function VisualPanelsCarousel() {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
        Módulos Integrados
      </h2>
      <div className="grid grid-cols-4 gap-4 lg:grid-cols-4">
        {visualPanels.map((panel, idx) => (
          <div
            key={idx}
            className="group relative col-span-2 h-44 overflow-hidden rounded-xl border border-slate-200 sm:col-span-1 dark:border-white/10"
          >
            <Image
              src={panel.image}
              alt={panel.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4">
              <h3 className="font-bold text-white drop-shadow-md">{panel.title}</h3>
              <p className="text-xs text-slate-200 drop-shadow">{panel.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
