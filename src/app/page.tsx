import { Suspense } from "react";
import { LandingLogin } from "@/components/landing/landing-login";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">
          Cargando acceso institucional…
        </div>
      }
    >
      <LandingLogin />
    </Suspense>
  );
}
