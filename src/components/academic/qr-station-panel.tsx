"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, QrCode, ScanLine, Wallet } from "lucide-react";
import { listarSimulaciones } from "@/lib/simulation-mutations";
import { listarMesas } from "@/lib/pos-mutations";
import type { Mesa, Simulacion } from "@/lib/academic-types";
import { buildQrImageUrl, buildQrLinks } from "@/lib/menu-qr";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  Button,
  Select,
} from "@/components/ui/academic-ui-kit";

export function QrStationPanel() {
  const [simulations, setSimulations] = useState<Simulacion[]>([]);
  const [tables, setTables] = useState<Mesa[]>([]);
  const [selectedSimId, setSelectedSimId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"menu" | "feedback" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([listarSimulaciones(), listarMesas()]).then(([simRows, tableRows]) => {
      if (ignore) return;
      setSimulations(simRows);
      setTables(tableRows);
      setSelectedSimId(
        simRows.find((item) => item.estado === "servicio_activo")?.id_simulacion ??
          simRows[0]?.id_simulacion ??
          "",
      );
      setSelectedTableId(tableRows[0]?.id_mesa ?? "");
    });
    return () => {
      ignore = true;
    };
  }, []);

  const links = useMemo(() => {
    if (!origin || !selectedSimId) return null;
    return buildQrLinks({
      origin,
      simulationId: selectedSimId,
      tableId: selectedTableId || undefined,
    });
  }, [origin, selectedSimId, selectedTableId]);

  const selectedTable = tables.find((table) => table.id_mesa === selectedTableId);

  async function copyToClipboard(kind: "menu" | "feedback") {
    if (!links) return;
    const target = kind === "menu" ? links.menuUrl : links.feedbackUrl;
    await navigator.clipboard.writeText(target);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <AcademicCard className="col-span-4 lg:col-span-1">
        <AcademicCardHeader title="Configuración QR" subtitle="Selecciona simulación y mesa." />
        <AcademicCardBody className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Simulación
            </p>
            <Select value={selectedSimId} onChange={(event) => setSelectedSimId(event.target.value)}>
              {simulations.map((simulation) => (
                <option key={simulation.id_simulacion} value={simulation.id_simulacion}>
                  {simulation.tipo_servicio} · {simulation.estado}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Mesa (obligatoria para servicio asistido)
            </p>
            <Select value={selectedTableId} onChange={(event) => setSelectedTableId(event.target.value)}>
              {tables.map((table) => (
                <option key={table.id_mesa} value={table.id_mesa}>
                  Mesa {table.numero_mesa} · {table.estado}
                </option>
              ))}
            </Select>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs font-semibold text-slate-600">
            {selectedTable
              ? `Mesa seleccionada: ${selectedTable.numero_mesa}.`
              : "Sin mesa seleccionada."}{" "}
            El comensal solo visualiza carta. El pedido lo registra el garzón en POS.
          </div>
        </AcademicCardBody>
      </AcademicCard>

      <AcademicCard className="col-span-4 lg:col-span-3">
        <AcademicCardHeader
          title="QR Comensal"
          subtitle="QR para visualizar menú y QR para feedback del cierre (sin autoservicio de pedido)."
        />
        <AcademicCardBody className="grid grid-cols-4 gap-4">
          {links ? (
            <>
              <div className="col-span-4 rounded-xl border border-slate-200 p-3 sm:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <ScanLine className="h-4 w-4 text-orange-600" />
                  Menú comensal
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildQrImageUrl(links.menuUrl)}
                  alt="QR menú comensal"
                  className="mx-auto h-56 w-56 rounded-lg border border-slate-200 bg-white p-2"
                />
                <p className="mt-3 break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                  {links.menuUrl}
                </p>
                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  icon={<Copy className="h-4 w-4" />}
                  onClick={() => void copyToClipboard("menu")}
                >
                  {copied === "menu" ? "URL copiada" : "Copiar URL"}
                </Button>
              </div>

              <div className="col-span-4 rounded-xl border border-slate-200 p-3 sm:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Feedback y pago ficticio
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildQrImageUrl(links.feedbackUrl)}
                  alt="QR feedback comensal"
                  className="mx-auto h-56 w-56 rounded-lg border border-slate-200 bg-white p-2"
                />
                <p className="mt-3 break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                  {links.feedbackUrl}
                </p>
                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  icon={<Copy className="h-4 w-4" />}
                  onClick={() => void copyToClipboard("feedback")}
                >
                  {copied === "feedback" ? "URL copiada" : "Copiar URL"}
                </Button>
              </div>
            </>
          ) : (
            <div className="col-span-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
              Selecciona una simulación para generar QR.
            </div>
          )}
        </AcademicCardBody>
      </AcademicCard>

      <AcademicCard className="col-span-4">
        <AcademicCardHeader
          title="Implementación operativa"
          subtitle="Cómo se conecta el QR con el flujo de servicio 360."
          action={<QrCode className="h-5 w-5 text-orange-600" />}
        />
        <AcademicCardBody className="grid grid-cols-4 gap-3 text-xs font-semibold text-slate-600">
          <div className="col-span-4 rounded-lg bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
            1. Comensal escanea QR menú y visualiza productos disponibles de la simulación.
          </div>
          <div className="col-span-4 rounded-lg bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
            2. Garzón toma el pedido y lo ingresa en POS. Desde ahí se genera comanda por área.
          </div>
          <div className="col-span-4 rounded-lg bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
            3. Al finalizar consumo, garzón/caja solicita al comensal completar feedback obligatorio.
          </div>
          <div className="col-span-4 rounded-lg bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
            4. Caja valida feedback para cierre ficticio y dispara descuento de inventario.
          </div>
        </AcademicCardBody>
      </AcademicCard>
    </div>
  );
}
