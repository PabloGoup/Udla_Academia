"use client";

import { AcademicPageShell } from "@/components/academic/academic-page-shell";
import { QrStationPanel } from "@/components/academic/qr-station-panel";

export default function QrAcademicoPage() {
  return (
    <AcademicPageShell
      title="QR Comensal"
      subtitle="Generación de QR para menú del comensal y feedback obligatorio para cierre ficticio."
    >
      <QrStationPanel />
    </AcademicPageShell>
  );
}
