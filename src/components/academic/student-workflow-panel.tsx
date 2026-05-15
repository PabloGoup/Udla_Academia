import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import type { StudentTask } from "@/lib/student-academic-dashboard";

const taskToneClass: Record<StudentTask["tone"], string> = {
  ready: "border-emerald-400/30 bg-emerald-50 text-emerald-900",
  attention: "border-amber-400/30 bg-amber-50 text-amber-900",
  pending: "border-slate-200 bg-white text-slate-900",
};

const taskIconClass: Record<StudentTask["tone"], string> = {
  ready: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  attention: "bg-amber-100 text-amber-700 ring-amber-200",
  pending: "bg-slate-100 text-slate-600 ring-slate-200",
};

const taskIcon = {
  ready: CheckCircle2,
  attention: AlertCircle,
  pending: Circle,
};

export function StudentWorkflowPanel({ tasks }: { tasks: StudentTask[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-black text-slate-950 sm:text-lg">Tareas del turno</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Acciones que conectan el rol del alumno con la simulación.
          </p>
        </div>

        <div className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
          {tasks.length} acciones
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => {
          const Icon = taskIcon[task.tone];

          return (
            <article
              key={`${task.title}-${task.tone}`}
              className={`min-w-0 rounded-xl border p-4 ${taskToneClass[task.tone]}`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${taskIconClass[task.tone]}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-black leading-5">
                    {task.title}
                  </h3>
                  <p className="mt-1 break-words text-sm leading-6 opacity-80">
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
