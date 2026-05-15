import { visualPanels } from "@/lib/demo-data";
import Image from "next/image";

export function VisualPanelsCarousel() {
  return (
    <div className="mb-5  sm:mb-8">
      <h2 className="mb-2 text-sm font-semibold text-slate-600 sm:mb-4 dark:text-slate-400">
        Módulos Integrados
      </h2>
      <div className="grid grid-cols-4 gap-1.5  sm:gap-4">
        {visualPanels.map((panel, idx) => (
          <div
            key={idx}
            className="group relative col-span-1 h-20 min-w-0 overflow-hidden rounded-lg border border-slate-200 sm:h-44 sm:rounded-xl dark:border-white/10"
          >
            <Image
              src={panel.image}
              alt={panel.title}
              fill
              sizes="(max-width: 640px) 25vw, (max-width: 1024px) 25vw, 360px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
            <div className="absolute bottom-0 left-0 min-w-0 p-1.5 sm:p-4">
              <h3 className="truncate text-[10px] font-bold leading-tight text-white drop-shadow-md sm:text-base">
                {panel.title}
              </h3>
              <p className="hidden text-[10px] leading-tight text-slate-200 drop-shadow sm:block sm:text-xs">
                {panel.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
