import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  Sparkles,
} from "lucide-react";

type InternalPlansPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

type Plan = {
  name: string;
  shortName: string;
  tag: string;
  implementationUf: number;
  maintenanceUf: number;
  summary: string;
  featured?: boolean;
  features: string[];
};

type ComparisonSection = {
  title: string;
  rows: Array<{
    label: string;
    values: [string, string, string];
  }>;
};

const internalToken = process.env.INTERNAL_PLANS_TOKEN ?? "udla-planes-2026";

const plans: Plan[] = [
  {
    name: "Modular Restaurante",
    shortName: "Modular",
    tag: "Piloto operativo",
    implementationUf: 95,
    maintenanceUf: 8,
    summary:
      "Entrada controlada para validar operacion de restaurante presencial en laboratorio.",
    features: [
      "Mesas, pedidos, cocina y caja",
      "Productos, recetas e inventario base",
      "Reportes iniciales y documentos",
      "Simulador academico demo",
      "Sin comision por venta",
    ],
  },
  {
    name: "Academico Personalizado",
    shortName: "Academico",
    tag: "Recomendado",
    implementationUf: 145,
    maintenanceUf: 12,
    summary:
      "Version academica con docentes, alumnos, escenarios y trazabilidad de aprendizaje.",
    featured: true,
    features: [
      "Todo lo del plan Modular",
      "Roles docente y alumno",
      "Escenarios evaluables por fase",
      "Reportes academicos y operativos",
      "Ajuste de casos segun asignatura",
    ],
  },
  {
    name: "Academico IA",
    shortName: "IA",
    tag: "Avanzado",
    implementationUf: 225,
    maintenanceUf: 15,
    summary:
      "Capa de asistencia inteligente para docentes, alumnos y analisis de escenarios.",
    features: [
      "Todo lo del plan Academico",
      "Chatbot academico controlado",
      "Resumen de desempeno",
      "Generacion asistida de escenarios",
      "Analisis de reportes y alertas",
    ],
  },
];

const comparisonSections: ComparisonSection[] = [
  {
    title: "Implementacion y soporte",
    rows: [
      {
        label: "Implementacion unica",
        values: ["95 UF + IVA", "145 UF + IVA", "225 UF + IVA"],
      },
      {
        label: "Mantencion mensual",
        values: ["8 UF + IVA", "12 UF + IVA", "15 UF + IVA"],
      },
      {
        label: "Comision por venta",
        values: ["0%", "0%", "0%"],
      },
      {
        label: "Soporte horario habil",
        values: ["Incluido", "Incluido", "Incluido"],
      },
      {
        label: "Backups y exportacion de datos",
        values: ["Incluido", "Incluido", "Incluido + IA"],
      },
    ],
  },
  {
    title: "Operacion de restaurante presencial",
    rows: [
      {
        label: "Mesas y salon",
        values: ["Incluido", "Incluido", "Incluido"],
      },
      {
        label: "Pedidos presenciales",
        values: ["Incluido", "Incluido", "Incluido"],
      },
      {
        label: "Cocina en tiempo real tipo KDS",
        values: ["Incluido", "Incluido", "Incluido"],
      },
      {
        label: "Caja, pagos y cierre",
        values: ["Incluido", "Incluido", "Incluido"],
      },
      {
        label: "Impresion y documentos",
        values: ["Incluido", "Incluido", "Incluido"],
      },
    ],
  },
  {
    title: "Costeo, inventario y seguridad alimentaria",
    rows: [
      {
        label: "Productos y carta operativa",
        values: ["Incluido", "Incluido", "Incluido"],
      },
      {
        label: "Recetario tecnico",
        values: ["Incluido", "Incluido", "Incluido"],
      },
      {
        label: "Food cost y margen",
        values: ["Incluido", "Avanzado", "Avanzado + alertas"],
      },
      {
        label: "Inventario, mermas y rendimiento",
        values: ["Incluido", "Incluido", "Incluido + alertas"],
      },
      {
        label: "Compras, proveedores e inocuidad",
        values: ["Incluido", "Incluido", "Incluido"],
      },
    ],
  },
  {
    title: "Modulo educativo",
    rows: [
      {
        label: "Datos demo y reinicio de escenarios",
        values: ["Incluido", "Incluido", "Incluido"],
      },
      {
        label: "Roles docente y alumno",
        values: ["No incluido", "Incluido", "Incluido"],
      },
      {
        label: "Escenarios evaluables",
        values: ["Demo", "Personalizados", "Personalizados + IA"],
      },
      {
        label: "Bitacora y evidencias",
        values: ["Incluido", "Incluido", "Incluido"],
      },
      {
        label: "Reportes academicos",
        values: ["No incluido", "Incluido", "Incluido + IA"],
      },
    ],
  },
  {
    title: "Inteligencia artificial",
    rows: [
      {
        label: "Chatbot academico",
        values: ["No incluido", "No incluido", "Incluido + IA"],
      },
      {
        label: "Explicacion asistida de errores",
        values: ["No incluido", "No incluido", "Incluido + IA"],
      },
      {
        label: "Generacion asistida de escenarios",
        values: ["No incluido", "No incluido", "Incluido + IA"],
      },
      {
        label: "Analisis conversacional de reportes",
        values: ["No incluido", "No incluido", "Incluido + IA"],
      },
      {
        label: "Consumo IA",
        values: ["No aplica", "No aplica", "Bolsa IA"],
      },
    ],
  },
];

export const metadata: Metadata = {
  title: "Planes internos UDLA | Propuesta comercial",
  description:
    "Pagina interna para comparar planes comerciales de la plataforma gastronomica academica UDLA.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function InternalPlansPage({
  searchParams,
}: InternalPlansPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  if (token !== internalToken) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#080c12] text-white">
      <style>{`
        @keyframes plan-card-enter {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .plan-card-motion {
            animation: plan-card-enter 560ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }
        }
      `}</style>
      <section
        className="relative isolate overflow-hidden border-b border-white/10 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(8,12,18,0.54), rgba(8,12,18,0.92)), url('https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=2200&q=80')",
        }}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-5 sm:px-8 md:min-h-[640px] md:py-6 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-white/15 bg-[#111722]/85 px-4 py-3 shadow-2xl backdrop-blur sm:rounded-full">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-24 items-center justify-center rounded-full bg-white px-3">
                <Image
                  src="/logo-original-udla.png"
                  alt="UDLA"
                  width={102}
                  height={30}
                  className="h-7 w-auto object-contain"
                  priority
                />
              </span>
              <span className="flex h-10 w-28 items-center justify-center rounded-full  px-4">
                <Image
                  src="/logo_goup.png"
                  alt="Goup Soluciones"
                  width={148}
                  height={80}
                  className="h-10 w-auto object-contain"
                />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
                  Propuesta interna
                </p>
                <p className="text-sm font-semibold">UDLA Academia Gastronomica</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
          
              <span className="hidden rounded-full bg-[var(--udla-orange)] px-4 py-2 text-sm font-semibold md:inline-flex">
                Chile · UF + IVA
              </span>
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center py-10 text-center md:py-16">
            <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 backdrop-blur sm:px-4 sm:text-sm">
              <Sparkles className="h-4 w-4 text-[var(--udla-orange)]" />
              Planes para laboratorio gastronomico academico
            </div>
            <h1 className="mx-auto mt-7 max-w-5xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl md:mt-8 md:text-6xl lg:text-7xl">
              Compara los planes de implementacion y mantencion
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/72 sm:text-lg md:mt-6 md:text-xl md:leading-8">
              Plataforma gastronomica academica con operacion real de restaurante,
              simulacion educativa, costeo, inventario, cocina en tiempo real y
              reportes para docentes.
            </p>

            <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-3 md:items-stretch md:gap-5">
              {plans.map((plan, index) => (
                <PlanCard key={plan.name} plan={plan} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

<div className="mt-10"></div>

      <section
        id="comparativa"
        className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 lg:px-10"
      >
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--udla-orange)]">
              Comparativa detallada
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Que incluye cada plan
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/60">
            Valores netos en UF. IVA, consumo IA, integraciones institucionales,
            hardware e impresoras se cotizan segun alcance.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d131d] shadow-2xl">
          <div>
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="w-[40%] px-2.5 py-3 text-[0.68rem] font-semibold text-white/55 sm:w-[34%] sm:px-5 sm:py-5 sm:text-sm">
                    Servicio
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="px-1.5 py-3 sm:px-5 sm:py-5">
                      <div className="text-center text-[0.68rem] font-semibold leading-tight text-white sm:text-left sm:text-sm">
                        <span className="sm:hidden">{plan.shortName}</span>
                        <span className="hidden sm:inline">{plan.name}</span>
                      </div>
                      <div className="mt-1 hidden text-xs text-white/48 sm:block">
                        {plan.tag}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonSections.map((section) => (
                  <ComparisonSectionRows key={section.title} section={section} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--udla-orange)]">
                <ClipboardCheck className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
                  Ruta recomendada
                </p>
                <h2 className="text-2xl font-semibold">Comenzar con piloto</h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["1", "Demo interna", "Validar interes, alcance y flujo visual."],
                ["2", "Piloto 90 dias", "Probar con docentes y alumnos reales."],
                ["3", "Escalamiento", "Pasar al plan academico o IA segun adopcion."],
              ].map(([step, title, description]) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-[#0a1018] p-5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-[#0a1018]">
                    {step}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-[var(--udla-orange)]/40 bg-[var(--udla-orange)] p-6 text-white shadow-2xl sm:p-8">
            <FileText className="h-8 w-8" />
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">
              Nota comercial
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/84">
              Esta pagina es interna, no esta enlazada desde la aplicacion y usa
              token de acceso. Para una propuesta formal se recomienda convertir
              este contenido en PDF ejecutivo y completar responsables, plazos y
              condiciones contractuales.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#111722]"
            >
              Ver demo del sistema
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  return (
    <article
      style={{ animationDelay: `${index * 90}ms` }}
      className={[
        "plan-card-motion group flex h-full flex-col rounded-[1.75rem] border p-5 text-left shadow-2xl transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(0,0,0,0.45)] focus-within:-translate-y-1 sm:p-6 md:min-h-[640px] md:rounded-[2rem] md:p-7",
        plan.featured
          ? "border-[var(--udla-orange)] bg-[#1a2540] hover:border-orange-300"
          : "border-white/10 bg-[#0f1722]/94 hover:border-white/25",
      ].join(" ")}
    >
      <div className="flex min-h-10 items-center justify-between gap-3">
        <span
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-300 group-hover:scale-[1.03]",
            plan.featured
              ? "bg-[var(--udla-orange)] text-white"
              : "bg-white text-[#111722]",
          ].join(" ")}
        >
          {plan.tag}
        </span>
        {plan.featured ? (
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/70">
            Mejor equilibrio
          </span>
        ) : null}
      </div>

      <h2 className="mt-6 text-2xl font-semibold leading-tight tracking-tight md:mt-7 md:min-h-[76px] md:text-[1.65rem] lg:text-3xl">
        {plan.name}
      </h2>
      <p className="mt-3 text-sm leading-6 text-white/66 md:mt-4 md:min-h-[72px]">
        {plan.summary}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 md:mt-7">
        <PriceBox label="Implementacion" value={`${plan.implementationUf} UF`} />
        <PriceBox label="Mantencion" value={`${plan.maintenanceUf} UF/mes`} />
      </div>
      <p className="mt-3 text-xs font-medium text-white/45">Valores + IVA</p>

      <ul className="mt-5 space-y-2 md:mt-7 md:space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm leading-5 text-white/78 md:leading-6">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[#07110b]">
              <Check className="h-3.5 w-3.5" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <a
        href="#comparativa"
        className={[
          "mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold transition-[transform,box-shadow,background-color] duration-300 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-white/70 md:mt-auto",
          plan.featured
            ? "bg-[var(--udla-orange)] text-white"
            : "bg-white text-[#111722]",
        ].join(" ")}
      >
        Revisar plan
        <ArrowRight className="h-4 w-4" />
      </a>
    </article>
  );
}

function PriceBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/42 sm:text-xs sm:tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function ComparisonSectionRows({ section }: { section: ComparisonSection }) {
  return (
    <>
      <tr className="bg-[#1c2634]">
        <td
          colSpan={4}
          className="px-2.5 py-3 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/85 sm:px-5 sm:py-4 sm:text-sm sm:tracking-[0.18em]"
        >
          {section.title}
        </td>
      </tr>
      {section.rows.map((row) => (
        <tr key={row.label} className="border-b border-white/10">
          <td className="px-2.5 py-3 text-[0.68rem] font-medium leading-4 text-white/76 sm:px-5 sm:py-4 sm:text-sm">
            {row.label}
          </td>
          {row.values.map((value, index) => (
            <td key={`${row.label}-${index}`} className="px-1 py-3 sm:px-5 sm:py-4">
              <ComparisonValue value={value} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function ComparisonValue({ value }: { value: string }) {
  const unavailable = value === "No incluido" || value === "No aplica";
  const highlighted =
    !unavailable &&
    (value.includes("Avanzado") ||
      value.includes("+ alertas") ||
      value.includes("+ IA") ||
      value === "Bolsa IA");
  const mobileValue = getMobileComparisonValue(value);

  return (
    <div
      aria-label={value}
      className="flex items-center justify-center gap-1 text-[0.66rem] leading-tight text-white/72 sm:justify-start sm:gap-2 sm:text-sm"
    >
      {unavailable ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/22 sm:h-2 sm:w-2" />
      ) : (
        <span
          className={[
            "h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[#07110b] sm:h-5 sm:w-5",
            highlighted ? "hidden sm:flex" : "flex",
          ].join(" ")}
        >
          <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </span>
      )}
      <span
        className={[
          highlighted
            ? "rounded-full border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 font-semibold text-emerald-100 sm:px-2 sm:py-1"
            : "",
          unavailable ? "text-white/48" : "",
        ].join(" ")}
      >
        <span className="sm:hidden">{mobileValue}</span>
        <span className="hidden sm:inline">{value}</span>
      </span>
    </div>
  );
}

function getMobileComparisonValue(value: string) {
  if (value === "Incluido") {
    return "";
  }

  if (value === "No incluido") {
    return "No";
  }

  if (value === "No aplica") {
    return "-";
  }

  return value
    .replace(" + IVA", "")
    .replace("Incluido + alertas", "+ alertas")
    .replace("Incluido + IA", "+ IA")
    .replace("Avanzado + alertas", "Av. +")
    .replace("Avanzado", "Av.")
    .replace("Personalizados + IA", "Pers.+IA")
    .replace("Personalizados", "Pers.");
}
