import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import type { StudentTask } from "@/lib/student-academic-dashboard";

const taskToneClass: Record<StudentTask["tone"], string> = {
  ready: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
  attention: "border-amber-400/25 bg-amber-400/10 text-amber-100",
  pending: "border-white/10 bg-white/[0.03] text-slate-200",
};

const taskIcon = {
  ready: CheckCircle2,
  attention: AlertCircle,
  pending: Circle,
};

export function StudentWorkflowPanel({ tasks }: { tasks: StudentTask[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#101722] p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Tareas del turno</h2>
          <p className="mt-1 text-sm text-slate-400">
            Acciones que conectan el rol del alumno con la simulacion.
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-300">
          {tasks.length} acciones
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => {
          const Icon = taskIcon[task.tone];

          return (
            <article
              key={`${task.title}-${task.tone}`}
              className={`rounded-md border p-3 ${taskToneClass[task.tone]}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">{task.title}</div>
                  <p className="mt-1 text-sm leading-6 opacity-80">
                    {task.detail}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
