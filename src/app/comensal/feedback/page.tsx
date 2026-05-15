"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageSquare, Star } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type ScoreField =
  | "puntuacion_atencion"
  | "puntuacion_sabor"
  | "puntuacion_presentacion"
  | "puntuacion_tiempo"
  | "puntuacion_limpieza"
  | "puntuacion_experiencia";

const scoreFields: Array<{ key: ScoreField; label: string }> = [
  { key: "puntuacion_atencion", label: "Atención" },
  { key: "puntuacion_sabor", label: "Sabor" },
  { key: "puntuacion_presentacion", label: "Presentación" },
  { key: "puntuacion_tiempo", label: "Tiempo" },
  { key: "puntuacion_limpieza", label: "Limpieza" },
  { key: "puntuacion_experiencia", label: "Experiencia" },
];

function ComensalFeedbackScreen() {
  const params = useSearchParams();
  const simulationId = params.get("sim") ?? "";
  const mesa = params.get("mesa") ?? "";
  const orderId = params.get("order") ?? null;
  const normalizedOrderId =
    orderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
      ? orderId
      : null;

  const [nombre, setNombre] = useState("");
  const [comentario, setComentario] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [scores, setScores] = useState<Record<ScoreField, number>>({
    puntuacion_atencion: 5,
    puntuacion_sabor: 5,
    puntuacion_presentacion: 5,
    puntuacion_tiempo: 5,
    puntuacion_limpieza: 5,
    puntuacion_experiencia: 5,
  });

  const average = useMemo(() => {
    const values = Object.values(scores);
    const total = values.reduce((acc, value) => acc + value, 0);
    return total / values.length;
  }, [scores]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);

    try {
      if (!simulationId) {
        throw new Error("Falta identificador de simulación en el QR.");
      }

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseBrowserClient();
        const { error: insertError } = await supabase.from("feedback_comensal").insert({
          id_simulacion: simulationId,
          id_venta: normalizedOrderId,
          mesa: mesa || null,
          nombre_comensal: nombre.trim() || "Comensal",
          puntuacion_atencion: scores.puntuacion_atencion,
          puntuacion_sabor: scores.puntuacion_sabor,
          puntuacion_presentacion: scores.puntuacion_presentacion,
          puntuacion_tiempo: scores.puntuacion_tiempo,
          puntuacion_limpieza: scores.puntuacion_limpieza,
          puntuacion_experiencia: scores.puntuacion_experiencia,
          comentario: comentario.trim(),
        });
        if (insertError) throw new Error(insertError.message);
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar feedback.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <h1 className="mt-3 text-2xl font-extrabold">¡Gracias por tu feedback!</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Tu evaluación quedó registrada. Ya se puede validar el cierre de pago ficticio en caja.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Feedback del servicio</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Simulación {simulationId ? simulationId.slice(0, 8) : "sin id"} {mesa ? `· Mesa ${mesa}` : ""}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Este feedback es obligatorio para cerrar el pago ficticio.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Nombre comensal
            <input
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="Ej: Carolina Muñoz"
            />
          </label>

          <div className="grid grid-cols-4 gap-3">
            {scoreFields.map((field) => (
              <label
                key={field.key}
                className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold uppercase tracking-wide text-slate-600 sm:col-span-1"
              >
                <span className="mb-2 inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {field.label}
                </span>
                <select
                  value={scores[field.key]}
                  onChange={(event) =>
                    setScores((prev) => ({
                      ...prev,
                      [field.key]: Number(event.target.value),
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </label>
            ))}
          </div>

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Comentario
            <textarea
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              className="mt-1 min-h-[100px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Cuéntanos tu experiencia."
            />
          </label>

          <div className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            Promedio experiencia: {average.toFixed(1)} / 5
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white transition hover:bg-orange-500 disabled:opacity-60"
          >
            <MessageSquare className="h-4 w-4" />
            {sending ? "Enviando..." : "Enviar feedback y habilitar cierre"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ComensalFeedbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">
            Cargando formulario de feedback...
          </div>
        </main>
      }
    >
      <ComensalFeedbackScreen />
    </Suspense>
  );
}
