import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

const realtimeTables = [
  "tables",
  "orders",
  "order_items",
  "kitchen_tickets",
  "products",
  "raw_materials",
  "inventory_movements",
  "cash_movements",
  "purchases",
  "purchase_items",
] as const;

export type RestaurantRealtimeStatus =
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED"
  | string;

export interface RestaurantRealtimeHandlers {
  onChange: () => void;
  onStatus?: (status: RestaurantRealtimeStatus) => void;
}

export function subscribeToRestaurantRealtime({
  onChange,
  onStatus,
}: RestaurantRealtimeHandlers) {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const supabase = getSupabaseBrowserClient();
  const channel = supabase.channel("restaurant-operations");

  realtimeTables.forEach((table) => {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      onChange,
    );
  });

  channel.subscribe((status) => {
    onStatus?.(status);
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}
