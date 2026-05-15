export interface QrLinksInput {
  origin: string;
  simulationId: string;
  tableId?: string;
  orderId?: string;
}

export interface QrLinksOutput {
  menuUrl: string;
  feedbackUrl: string;
}

export function buildQrLinks(input: QrLinksInput): QrLinksOutput {
  const { origin, simulationId, tableId, orderId } = input;

  const menuParams = new URLSearchParams({ sim: simulationId });
  if (tableId) menuParams.set("mesa", tableId);

  const feedbackParams = new URLSearchParams({ sim: simulationId });
  if (tableId) feedbackParams.set("mesa", tableId);
  if (orderId) feedbackParams.set("order", orderId);

  return {
    menuUrl: `${origin}/comensal/menu?${menuParams.toString()}`,
    feedbackUrl: `${origin}/comensal/feedback?${feedbackParams.toString()}`,
  };
}

export function buildQrImageUrl(targetUrl: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    targetUrl,
  )}`;
}
