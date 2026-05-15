"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ChefHat,
  ImagePlus,
  ListOrdered,
  PencilLine,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import { listarProductosSimulacion } from "@/lib/warehouse-mutations";
import { listarSimulaciones } from "@/lib/simulation-mutations";
import {
  persistProductCatalogItem,
  type ProductCatalogDraft,
} from "@/lib/operations";
import { uploadAcademicImage } from "@/lib/storage-upload";
import type { Simulacion } from "@/lib/academic-types";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  Button,
  FormField,
  Input,
  MetricCard,
  Modal,
  OperationToast,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui/academic-ui-kit";

interface SimulationProductCount {
  id_producto: string;
  cantidad_asignada: number;
  cantidad_utilizada: number;
}

type ProductEditorDraft = ProductCatalogDraft & { id: string };

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-CL")}`;
}

function parseCustomizationOptions(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function MenuProductsPanel() {
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot | null>(null);
  const [simulations, setSimulations] = useState<Simulacion[]>([]);
  const [selectedSimId, setSelectedSimId] = useState("");
  const [simulationProducts, setSimulationProducts] = useState<SimulationProductCount[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorDraft, setEditorDraft] = useState<ProductEditorDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSnapshot, nextSimulations] = await Promise.all([
        loadRestaurantSnapshot(),
        listarSimulaciones(),
      ]);
      setSnapshot(nextSnapshot);
      setSimulations(nextSimulations);
      const defaultSimId =
        nextSimulations.find((item) => item.estado === "servicio_activo")?.id_simulacion ??
        nextSimulations[0]?.id_simulacion ??
        "";
      setSelectedSimId(defaultSimId);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedSimId) {
      setSimulationProducts([]);
      return;
    }

    let ignore = false;
    void listarProductosSimulacion(selectedSimId).then((rows) => {
      if (!ignore) {
        setSimulationProducts(
          rows.map((row) => ({
            id_producto: row.id_producto,
            cantidad_asignada: row.cantidad_asignada,
            cantidad_utilizada: row.cantidad_utilizada,
          })),
        );
      }
    });
    return () => {
      ignore = true;
    };
  }, [selectedSimId]);

  const products = useMemo(() => snapshot?.products ?? [], [snapshot]);
  const categories = useMemo(() => snapshot?.productCategories ?? [], [snapshot]);
  const recipes = useMemo(() => snapshot?.recipes ?? [], [snapshot]);
  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item])),
    [categories],
  );
  const simulationProductMap = useMemo(
    () => new Map(simulationProducts.map((item) => [item.id_producto, item])),
    [simulationProducts],
  );
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? products[0] ?? null;

  useEffect(() => {
    if (!products.length) {
      setSelectedProductId("");
      return;
    }
    if (!selectedProductId || !products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const availableProducts = products.filter((item) => item.available);
  const withPhoto = products.filter((item) => Boolean(item.image)).length;
  const linkedToRecipe = products.filter((item) => Boolean(item.recipeId)).length;

  function openEditor(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setEditorDraft({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      recipeId: product.recipeId,
      description: product.description,
      imageUrl: product.image,
      salePrice: product.price,
      isAvailable: product.available,
      prepTimeMinutes: product.prepTimeMinutes,
      customizationOptions: [...product.modifiers],
    });
    setEditorOpen(true);
  }

  async function saveProduct() {
    if (!editorDraft) return;
    if (!editorDraft.name.trim()) {
      setToast({ message: "El nombre del producto es obligatorio.", tone: "error" });
      return;
    }

    setSaving(true);
    const result = await persistProductCatalogItem(editorDraft);
    setSaving(false);

    if (!result.ok) {
      setToast({ message: result.message, tone: "error" });
      return;
    }

    setSnapshot((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((item) =>
          item.id === editorDraft.id
            ? {
                ...item,
                name: editorDraft.name,
                categoryId: editorDraft.categoryId,
                recipeId: editorDraft.recipeId,
                description: editorDraft.description,
                image: editorDraft.imageUrl,
                price: editorDraft.salePrice,
                available: editorDraft.isAvailable,
                prepTimeMinutes: editorDraft.prepTimeMinutes,
                modifiers: [...editorDraft.customizationOptions],
              }
            : item,
        ),
      };
    });

    setToast({ message: result.message, tone: "success" });
    setEditorOpen(false);
  }

  async function handleProductImageUpload(file: File | null) {
    if (!file) return;
    setUploadingImage(true);
    const upload = await uploadAcademicImage(file, "menu");
    setUploadingImage(false);

    if (!upload.ok) {
      setToast({ message: upload.message, tone: "error" });
      return;
    }

    setEditorDraft((prev) => (prev ? { ...prev, imageUrl: upload.url } : prev));
    setToast({ message: "Imagen del producto cargada correctamente.", tone: "success" });
  }

  function triggerGalleryUpload() {
    galleryInputRef.current?.click();
  }

  function triggerCameraUpload() {
    cameraInputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Productos menu"
          value={String(products.length)}
          icon={<ChefHat className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Disponibles"
          value={String(availableProducts.length)}
          icon={<Sparkles className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <MetricCard
          label="Con fotografia"
          value={String(withPhoto)}
          icon={<Camera className="h-3.5 w-3.5" />}
          tone="purple"
        />
        <MetricCard
          label="Con receta"
          value={String(linkedToRecipe)}
          icon={<ListOrdered className="h-3.5 w-3.5" />}
          tone="orange"
        />
      </div>

      <AcademicCard>
        <AcademicCardHeader
          title="Menu por simulacion"
          subtitle="Productos comerciales, fotografia y disponibilidad por servicio."
          action={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="min-w-[200px]">
                <Select
                  value={selectedSimId}
                  onChange={(event) => setSelectedSimId(event.target.value)}
                  disabled={loading || simulations.length === 0}
                >
                  {simulations.map((simulation) => (
                    <option key={simulation.id_simulacion} value={simulation.id_simulacion}>
                      {simulation.tipo_servicio} · {simulation.estado}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="secondary"
                icon={<PencilLine className="h-4 w-4" />}
                onClick={() => selectedProduct && openEditor(selectedProduct.id)}
                disabled={!selectedProduct}
              >
                Editar producto
              </Button>
            </div>
          }
        />
        <AcademicCardBody className="grid grid-cols-4 gap-3 p-3">
          {loading ? (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500">
              Cargando menu...
            </div>
          ) : null}

          {!loading && products.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
              No hay productos de menu registrados.
            </div>
          ) : null}

          {!loading
            ? products.map((product) => {
                const category = categoryMap.get(product.categoryId);
                const simProduct = simulationProductMap.get(product.id);
                const active = selectedProductId === product.id;
                return (
                  <article
                    key={product.id}
                    className={`col-span-4 overflow-hidden rounded-xl border bg-white shadow-sm sm:col-span-2 lg:col-span-1 ${
                      active ? "border-orange-500" : "border-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-36 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-slate-400">
                          <Camera className="h-6 w-6" />
                        </div>
                      )}
                      <div className="space-y-2 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-sm font-extrabold uppercase tracking-tight text-slate-900">
                            {product.name}
                          </h3>
                          <StatusBadge
                            label={product.available ? "Activo" : "No disp."}
                            tone={product.available ? "emerald" : "zinc"}
                          />
                        </div>
                        <p className="line-clamp-2 text-xs text-slate-600">{product.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                          <span>{formatCurrency(product.price)}</span>
                          <span>· {product.prepTimeMinutes} min</span>
                          {category ? <span>· {category.name}</span> : null}
                        </div>
                        {simProduct ? (
                          <div className="rounded-lg bg-slate-50 p-2 text-[11px] font-semibold text-slate-600">
                            Plan: {simProduct.cantidad_asignada} · Recepcion:{" "}
                            {simProduct.cantidad_utilizada}
                          </div>
                        ) : (
                          <div className="rounded-lg bg-amber-50 p-2 text-[11px] font-semibold text-amber-700">
                            Sin asignacion en simulacion seleccionada.
                          </div>
                        )}
                      </div>
                    </button>
                  </article>
                );
              })
            : null}
        </AcademicCardBody>
      </AcademicCard>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title="Editar producto de menu"
        maxWidth="max-w-3xl"
        bodyClassName="max-h-[74vh] sm:max-h-[80vh]"
      >
        {editorDraft ? (
          <div className="flex flex-col gap-4">
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.currentTarget.value = "";
                void handleProductImageUpload(file);
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.currentTarget.value = "";
                void handleProductImageUpload(file);
              }}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Nombre">
                <Input
                  value={editorDraft.name}
                  onChange={(event) =>
                    setEditorDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                />
              </FormField>
              <FormField label="Categoria">
                <Select
                  value={editorDraft.categoryId}
                  onChange={(event) =>
                    setEditorDraft((prev) =>
                      prev ? { ...prev, categoryId: event.target.value } : prev,
                    )
                  }
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <FormField label="Receta asociada">
                <Select
                  value={editorDraft.recipeId ?? ""}
                  onChange={(event) =>
                    setEditorDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            recipeId: event.target.value || undefined,
                          }
                        : prev,
                    )
                  }
                >
                  <option value="">Sin receta</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Imagen desde dispositivo">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    type="button"
                    icon={<Upload className="h-4 w-4" />}
                    onClick={triggerGalleryUpload}
                    disabled={uploadingImage}
                    className="w-full sm:w-auto"
                  >
                    Subir imagen
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    icon={<Camera className="h-4 w-4" />}
                    onClick={triggerCameraUpload}
                    disabled={uploadingImage}
                    className="w-full sm:w-auto"
                  >
                    Tomar foto
                  </Button>
                  {uploadingImage ? (
                    <span className="text-xs font-semibold text-slate-500">Subiendo...</span>
                  ) : null}
                </div>
              </FormField>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                {editorDraft.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editorDraft.imageUrl}
                    alt="Preview producto"
                    className="h-32 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-500">
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Sin imagen
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label="Precio venta">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={editorDraft.salePrice}
                  onChange={(event) =>
                    setEditorDraft((prev) =>
                      prev ? { ...prev, salePrice: Number(event.target.value) } : prev,
                    )
                  }
                />
              </FormField>
              <FormField label="Prep (min)">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={editorDraft.prepTimeMinutes}
                  onChange={(event) =>
                    setEditorDraft((prev) =>
                      prev ? { ...prev, prepTimeMinutes: Number(event.target.value) } : prev,
                    )
                  }
                />
              </FormField>
              <FormField label="Disponibilidad">
                <Select
                  value={editorDraft.isAvailable ? "true" : "false"}
                  onChange={(event) =>
                    setEditorDraft((prev) =>
                      prev
                        ? { ...prev, isAvailable: event.target.value === "true" }
                        : prev,
                    )
                  }
                >
                  <option value="true">Disponible</option>
                  <option value="false">No disponible</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Descripcion">
              <Textarea
                value={editorDraft.description}
                onChange={(event) =>
                  setEditorDraft((prev) =>
                    prev ? { ...prev, description: event.target.value } : prev,
                  )
                }
              />
            </FormField>

            <FormField label="Opciones de personalizacion (coma)">
              <Input
                value={editorDraft.customizationOptions.join(", ")}
                onChange={(event) =>
                  setEditorDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          customizationOptions: parseCustomizationOptions(
                            event.target.value,
                          ),
                        }
                      : prev,
                  )
                }
              />
            </FormField>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditorOpen(false)} type="button">
                Cancelar
              </Button>
              <Button
                icon={<Save className="h-4 w-4" />}
                onClick={() => void saveProduct()}
                disabled={saving}
                type="button"
              >
                {saving ? "Guardando..." : "Guardar producto"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {toast ? (
        <OperationToast
          message={toast.message}
          tone={toast.tone}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
