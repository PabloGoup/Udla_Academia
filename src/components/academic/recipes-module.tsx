"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Beef,
  Camera,
  ChefHat,
  FlaskConical,
  ImagePlus,
  PencilLine,
  Plus,
  Save,
  Scale,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  listarRecetasConCosteo,
  obtenerIngredientesReceta,
} from "@/lib/recetas-mutations";
import { listarProductosBodega } from "@/lib/warehouse-mutations";
import { loadRestaurantSnapshot, type RestaurantSnapshot } from "@/lib/data-source";
import {
  persistTechnicalRecipe,
  type TechnicalRecipeDraft,
} from "@/lib/operations";
import { uploadAcademicImage } from "@/lib/storage-upload";
import type {
  IngredienteReceta,
  ProductoBodega,
  Receta,
} from "@/lib/academic-types";
import {
  AcademicCard,
  AcademicCardBody,
  AcademicCardHeader,
  Button,
  EmptyState,
  FormField,
  Input,
  MetricCard,
  Modal,
  OperationToast,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui/academic-ui-kit";

type RecipesModuleMode = "recetas" | "sub-recetas";

interface RecipesModuleProps {
  mode: RecipesModuleMode;
}

type RecipeEditorIngredient = {
  rawMaterialId: string;
  unit: string;
  grossQuantity: number;
  yieldPercent: number;
  wasteType: string;
};

type RecipeEditorDraft = {
  id: string;
  name: string;
  category: string;
  portions: number;
  prepTimeMinutes: number;
  photoUrl: string;
  procedure: string;
  allergensText: string;
  observations: string;
  targetFoodCostPercent: number;
  salePrice: number;
  ingredients: RecipeEditorIngredient[];
};

function isSubRecipeCategory(category: string): boolean {
  const normalized = category.toLowerCase();
  return (
    normalized.includes("sub") ||
    normalized.includes("mise") ||
    normalized.includes("base") ||
    normalized.includes("salsa") ||
    normalized.includes("prep")
  );
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-CL")}`;
}

function normalizeNumber(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return value;
}

function normalizeRecipeUnit(unit: string): "g" | "kg" | "ml" | "l" | "unit" {
  if (unit === "g" || unit === "kg" || unit === "ml" || unit === "l" || unit === "unit") {
    return unit;
  }
  if (unit === "L") return "l";
  if (unit === "un") return "unit";
  return "g";
}

export function RecipesModule({ mode }: RecipesModuleProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<Receta[]>([]);
  const [materials, setMaterials] = useState<ProductoBodega[]>([]);
  const [snapshot, setSnapshot] = useState<RestaurantSnapshot | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [ingredients, setIngredients] = useState<IngredienteReceta[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorDraft, setEditorDraft] = useState<RecipeEditorDraft | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    null,
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextRecipes, nextMaterials, nextSnapshot] = await Promise.all([
        listarRecetasConCosteo(),
        listarProductosBodega(),
        loadRestaurantSnapshot(),
      ]);
      setRecipes(nextRecipes);
      setMaterials(nextMaterials);
      setSnapshot(nextSnapshot);
    } finally {
      setLoading(false);
    }
  }, []);

  const visibleRecipes = useMemo(() => {
    const byMode = recipes.filter((recipe) =>
      mode === "sub-recetas"
        ? isSubRecipeCategory(recipe.categoria)
        : !isSubRecipeCategory(recipe.categoria),
    );

    if (!query.trim()) return byMode;
    const q = query.toLowerCase();
    return byMode.filter(
      (recipe) =>
        recipe.nombre_receta.toLowerCase().includes(q) ||
        recipe.categoria.toLowerCase().includes(q),
    );
  }, [mode, query, recipes]);

  const selectedRecipe =
    visibleRecipes.find((recipe) => recipe.id_receta === selectedRecipeId) ??
    visibleRecipes[0] ??
    null;

  const selectedRecipeSnapshot = useMemo(() => {
    if (!snapshot || !selectedRecipe) return null;
    return snapshot.recipes.find((recipe) => recipe.id === selectedRecipe.id_receta) ?? null;
  }, [selectedRecipe, snapshot]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedRecipe) {
      setIngredients([]);
      return;
    }

    let ignore = false;
    void obtenerIngredientesReceta(selectedRecipe.id_receta).then((rows) => {
      if (!ignore) setIngredients(rows);
    });

    return () => {
      ignore = true;
    };
  }, [selectedRecipe]);

  useEffect(() => {
    if (!visibleRecipes.length) {
      setSelectedRecipeId("");
      return;
    }
    if (!selectedRecipeId || !visibleRecipes.some((r) => r.id_receta === selectedRecipeId)) {
      setSelectedRecipeId(visibleRecipes[0].id_receta);
    }
  }, [selectedRecipeId, visibleRecipes]);

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id_producto, material])),
    [materials],
  );

  const totalGross = useMemo(
    () => ingredients.reduce((acc, item) => acc + Number(item.cantidad ?? 0), 0),
    [ingredients],
  );
  const avgYield = useMemo(() => {
    if (!ingredients.length) return 0;
    const total = ingredients.reduce(
      (acc, item) => acc + Number(item.rendimiento_porcentaje ?? 0),
      0,
    );
    return total / ingredients.length;
  }, [ingredients]);

  function openEditor() {
    if (!selectedRecipe) return;

    const detailIngredients =
      selectedRecipeSnapshot?.ingredients.map((item) => ({
        rawMaterialId: item.rawMaterialId,
        unit: item.unit,
        grossQuantity: Number(item.grossQuantity ?? 0),
        yieldPercent: Number(item.yieldPercent ?? 100),
        wasteType: item.wasteType ?? "Sin merma",
      })) ?? [];

    const uiIngredients: RecipeEditorIngredient[] = (
      ingredients.length
        ? ingredients.map((item) => ({
            rawMaterialId: item.id_producto,
            unit: normalizeRecipeUnit(
              item.unidad_medida || materialById.get(item.id_producto)?.unidad_medida || "g",
            ),
            grossQuantity: Number(item.cantidad ?? 0),
            yieldPercent: Number(item.rendimiento_porcentaje ?? 100),
            wasteType: "Sin merma",
          }))
        : detailIngredients
    ).filter((item) => item.rawMaterialId);

    setEditorDraft({
      id: selectedRecipe.id_receta,
      name: selectedRecipeSnapshot?.name ?? selectedRecipe.nombre_receta,
      category: selectedRecipeSnapshot?.category ?? selectedRecipe.categoria,
      portions: normalizeNumber(selectedRecipeSnapshot?.portions ?? selectedRecipe.porciones, 1),
      prepTimeMinutes: normalizeNumber(
        selectedRecipeSnapshot?.prepTimeMinutes ?? 0,
        0,
      ),
      photoUrl: selectedRecipeSnapshot?.image ?? "",
      procedure: selectedRecipeSnapshot?.procedure ?? selectedRecipe.procedimiento ?? "",
      allergensText: (selectedRecipeSnapshot?.allergens ?? []).join(", "),
      observations: selectedRecipeSnapshot?.observations ?? "",
      targetFoodCostPercent: normalizeNumber(
        selectedRecipeSnapshot?.targetFoodCostPercent ?? 30,
        30,
      ),
      salePrice: normalizeNumber(selectedRecipeSnapshot?.salePrice ?? selectedRecipe.precio_venta, 0),
      ingredients: uiIngredients,
    });
    setEditorOpen(true);
  }

  function updateIngredient(
    index: number,
    patch: Partial<RecipeEditorIngredient>,
  ) {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const next = [...prev.ingredients];
      next[index] = { ...next[index], ...patch };
      return { ...prev, ingredients: next };
    });
  }

  function addIngredient() {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const firstMaterial = materials[0];
      return {
        ...prev,
        ingredients: [
          ...prev.ingredients,
          {
            rawMaterialId: firstMaterial?.id_producto ?? "",
            unit: normalizeRecipeUnit(firstMaterial?.unidad_medida ?? "g"),
            grossQuantity: 0,
            yieldPercent: 100,
            wasteType: "Sin merma",
          },
        ],
      };
    });
  }

  function removeIngredient(index: number) {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index),
      };
    });
  }

  async function saveRecipe() {
    if (!editorDraft) return;

    const draft: TechnicalRecipeDraft = {
      id: editorDraft.id,
      name: editorDraft.name.trim(),
      category: editorDraft.category.trim(),
      portions: Math.max(1, Number(editorDraft.portions || 1)),
      prepTimeMinutes: Math.max(0, Number(editorDraft.prepTimeMinutes || 0)),
      photoUrl: editorDraft.photoUrl.trim(),
      procedure: editorDraft.procedure,
      allergens: editorDraft.allergensText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      observations: editorDraft.observations,
      targetFoodCostPercent: Math.max(1, Number(editorDraft.targetFoodCostPercent || 30)),
      salePrice: Math.max(0, Number(editorDraft.salePrice || 0)),
      ingredients: editorDraft.ingredients
        .filter((item) => item.rawMaterialId && Number(item.grossQuantity) > 0)
        .map((item) => ({
          rawMaterialId: item.rawMaterialId,
          unit: normalizeRecipeUnit(item.unit),
          grossQuantity: Number(item.grossQuantity),
          yieldPercent: Math.max(1, Math.min(100, Number(item.yieldPercent || 100))),
          wasteType: item.wasteType || "Sin merma",
        })),
    };

    if (!draft.name || !draft.category || draft.ingredients.length === 0) {
      setToast({
        message: "Debes completar nombre, categoria e ingredientes validos.",
        tone: "error",
      });
      return;
    }

    setSaving(true);
    const result = await persistTechnicalRecipe(draft);
    setSaving(false);

    if (!result.ok) {
      setToast({ message: result.message, tone: "error" });
      return;
    }

    setRecipes((prev) =>
      prev.map((item) =>
        item.id_receta === draft.id
          ? {
              ...item,
              nombre_receta: draft.name,
              categoria: draft.category,
              porciones: draft.portions,
              rendimiento: draft.portions,
              precio_venta: draft.salePrice,
              procedimiento: draft.procedure,
            }
          : item,
      ),
    );

    setIngredients(
      draft.ingredients.map((item, index) => ({
        id_ingrediente: `${draft.id}-tmp-${index}`,
        id_receta: draft.id ?? "",
        id_producto: item.rawMaterialId,
        cantidad: item.grossQuantity,
        unidad_medida: item.unit,
        merma_porcentaje: Math.max(0, 100 - item.yieldPercent),
        rendimiento_porcentaje: item.yieldPercent,
      })),
    );

    setToast({ message: result.message, tone: "success" });
    setEditorOpen(false);
    void loadData();
  }

  async function handleRecipePhotoUpload(file: File | null) {
    if (!file) return;
    setUploadingPhoto(true);
    const upload = await uploadAcademicImage(file, "recipes");
    setUploadingPhoto(false);

    if (!upload.ok) {
      setToast({ message: upload.message, tone: "error" });
      return;
    }

    setEditorDraft((prev) => (prev ? { ...prev, photoUrl: upload.url } : prev));
    setToast({ message: "Imagen de receta cargada correctamente.", tone: "success" });
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
          label={mode === "sub-recetas" ? "Sub-recetas" : "Recetas"}
          value={String(visibleRecipes.length)}
          icon={<ChefHat className="h-3.5 w-3.5" />}
          tone="orange"
        />
        <MetricCard
          label="Ingredientes"
          value={String(ingredients.length)}
          icon={<Beef className="h-3.5 w-3.5" />}
          tone="sky"
        />
        <MetricCard
          label="Rendimiento prom."
          value={`${avgYield.toFixed(1)}%`}
          icon={<FlaskConical className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <MetricCard
          label="Carga bruta"
          value={totalGross.toFixed(2)}
          icon={<Scale className="h-3.5 w-3.5" />}
          tone="purple"
        />
      </div>

      <AcademicCard>
        <AcademicCardHeader
          title={mode === "sub-recetas" ? "Sub-recetas de mise en place" : "Recetas tecnicas"}
          subtitle="Costeo, rendimiento, merma y edicion de ficha tecnica."
          action={
            <Button
              variant="secondary"
              icon={<PencilLine className="h-4 w-4" />}
              onClick={openEditor}
              disabled={!selectedRecipe}
            >
              Editar receta
            </Button>
          }
        />
        <AcademicCardBody>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o categoria..."
              className="w-full pl-10"
            />
          </div>
        </AcademicCardBody>
        <AcademicCardBody className="grid gap-3 border-t border-slate-200 p-3 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500">
              Cargando recetas...
            </div>
          ) : null}

          {!loading && visibleRecipes.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={<ChefHat className="h-8 w-8" />}
                title="Sin recetas disponibles"
                message="No hay recetas que coincidan con el filtro actual."
              />
            </div>
          ) : null}

          {!loading
            ? visibleRecipes.map((recipe) => {
                const active = selectedRecipe?.id_receta === recipe.id_receta;
                return (
                  <button
                    key={recipe.id_receta}
                    type="button"
                    onClick={() => setSelectedRecipeId(recipe.id_receta)}
                    className={`col-span-2 rounded-xl border p-4 text-left transition sm:col-span-1 ${
                      active
                        ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-500/10"
                        : "border-slate-200 bg-white hover:border-orange-300 dark:border-white/10 dark:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                        {recipe.nombre_receta}
                      </p>
                      <StatusBadge
                        label={recipe.categoria}
                        tone={mode === "sub-recetas" ? "purple" : "sky"}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>Costo: {formatCurrency(recipe.costo_total)}</span>
                      <span>Precio: {formatCurrency(recipe.precio_venta)}</span>
                      <span>Margen: {formatCurrency(recipe.margen)}</span>
                      <span>Porciones: {recipe.porciones}</span>
                    </div>
                  </button>
                );
              })
            : null}
        </AcademicCardBody>
      </AcademicCard>

      <AcademicCard>
        <AcademicCardHeader
          title="Materias primas y rendimiento"
          subtitle="Detalle tecnico de ingredientes de la receta seleccionada."
        />
        <AcademicCardBody className="p-0">
          {selectedRecipe && ingredients.length ? (
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {ingredients.map((ingredient) => {
                const material = materialById.get(ingredient.id_producto);
                const gross = Number(ingredient.cantidad ?? 0);
                const yieldPercent = Number(ingredient.rendimiento_porcentaje ?? 100);
                const net = gross * (yieldPercent / 100);
                const waste = Math.max(0, gross - net);
                return (
                  <div
                    key={ingredient.id_ingrediente}
                    className="grid grid-cols-4 gap-2 px-4 py-3 text-xs sm:text-sm"
                  >
                    <div className="col-span-4 font-bold text-slate-900 dark:text-white sm:col-span-1">
                      {material?.nombre_producto ?? ingredient.id_producto}
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="font-semibold text-slate-500">Bruto:</span>{" "}
                      {gross.toFixed(2)} {ingredient.unidad_medida}
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="font-semibold text-slate-500">Rend.:</span>{" "}
                      {yieldPercent.toFixed(1)}%
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="font-semibold text-slate-500">Neto:</span>{" "}
                      {net.toFixed(2)}
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="font-semibold text-slate-500">Merma:</span>{" "}
                      {waste.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-10 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Selecciona una receta para revisar materias primas y rendimiento.
            </div>
          )}
        </AcademicCardBody>
      </AcademicCard>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={mode === "sub-recetas" ? "Editar sub-receta" : "Editar receta"}
        maxWidth="max-w-4xl"
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
                void handleRecipePhotoUpload(file);
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
                void handleRecipePhotoUpload(file);
              }}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Nombre" htmlFor="recipe-name">
                <Input
                  id="recipe-name"
                  value={editorDraft.name}
                  onChange={(event) =>
                    setEditorDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                />
              </FormField>
              <FormField label="Categoria" htmlFor="recipe-category">
                <Input
                  id="recipe-category"
                  value={editorDraft.category}
                  onChange={(event) =>
                    setEditorDraft((prev) =>
                      prev ? { ...prev, category: event.target.value } : prev,
                    )
                  }
                />
              </FormField>
              <FormField label="Porciones" htmlFor="recipe-portions">
                <Input
                  id="recipe-portions"
                  type="number"
                  min={1}
                  step="1"
                  value={editorDraft.portions}
                  onChange={(event) =>
                    setEditorDraft((prev) =>
                      prev ? { ...prev, portions: Number(event.target.value) } : prev,
                    )
                  }
                />
              </FormField>
              <FormField label="Prep (min)" htmlFor="recipe-prep">
                <Input
                  id="recipe-prep"
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Precio venta" htmlFor="recipe-price">
                <Input
                  id="recipe-price"
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
              <FormField label="Food cost obj. %" htmlFor="recipe-foodcost">
                <Input
                  id="recipe-foodcost"
                  type="number"
                  min={1}
                  max={100}
                  step="0.1"
                  value={editorDraft.targetFoodCostPercent}
                  onChange={(event) =>
                    setEditorDraft((prev) =>
                      prev
                        ? { ...prev, targetFoodCostPercent: Number(event.target.value) }
                        : prev,
                    )
                  }
                />
              </FormField>
              <FormField label="Alergenos (coma)" htmlFor="recipe-allergens">
                <Input
                  id="recipe-allergens"
                  value={editorDraft.allergensText}
                  onChange={(event) =>
                    setEditorDraft((prev) =>
                      prev ? { ...prev, allergensText: event.target.value } : prev,
                    )
                  }
                />
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
                    disabled={uploadingPhoto}
                    className="w-full sm:w-auto"
                  >
                    Subir imagen
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    icon={<Camera className="h-4 w-4" />}
                    onClick={triggerCameraUpload}
                    disabled={uploadingPhoto}
                    className="w-full sm:w-auto"
                  >
                    Tomar foto
                  </Button>
                  {uploadingPhoto ? (
                    <span className="text-xs font-semibold text-slate-500">Subiendo...</span>
                  ) : null}
                </div>
              </FormField>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                {editorDraft.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editorDraft.photoUrl}
                    alt="Preview receta"
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

            <FormField label="Procedimiento" htmlFor="recipe-procedure">
              <Textarea
                id="recipe-procedure"
                value={editorDraft.procedure}
                onChange={(event) =>
                  setEditorDraft((prev) =>
                    prev ? { ...prev, procedure: event.target.value } : prev,
                  )
                }
              />
            </FormField>

            <FormField label="Observaciones" htmlFor="recipe-observations">
              <Textarea
                id="recipe-observations"
                value={editorDraft.observations}
                onChange={(event) =>
                  setEditorDraft((prev) =>
                    prev ? { ...prev, observations: event.target.value } : prev,
                  )
                }
              />
            </FormField>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Ingredientes y rendimiento
                </p>
                <Button
                  variant="secondary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={addIngredient}
                  type="button"
                >
                  Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {editorDraft.ingredients.map((ingredient, index) => (
                  <div
                    key={`${ingredient.rawMaterialId}-${index}`}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-12">
                      <div className="sm:col-span-2 xl:col-span-4">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Materia prima
                        </p>
                        <Select
                          value={ingredient.rawMaterialId}
                          onChange={(event) => {
                            const material = materialById.get(event.target.value);
                            updateIngredient(index, {
                              rawMaterialId: event.target.value,
                              unit: normalizeRecipeUnit(material?.unidad_medida ?? ingredient.unit),
                            });
                          }}
                        >
                          {materials.map((material) => (
                            <option key={material.id_producto} value={material.id_producto}>
                              {material.nombre_producto}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="xl:col-span-2">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Unidad
                        </p>
                        <Select
                          value={ingredient.unit}
                          onChange={(event) =>
                            updateIngredient(index, {
                              unit: normalizeRecipeUnit(event.target.value),
                            })
                          }
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="unit">unit</option>
                        </Select>
                      </div>
                      <div className="xl:col-span-2">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Cant. bruta
                        </p>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={ingredient.grossQuantity}
                          onChange={(event) =>
                            updateIngredient(index, {
                              grossQuantity: Number(event.target.value),
                            })
                          }
                          placeholder="Bruto"
                        />
                      </div>
                      <div className="xl:col-span-2">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Rendimiento %
                        </p>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          step="0.1"
                          value={ingredient.yieldPercent}
                          onChange={(event) =>
                            updateIngredient(index, {
                              yieldPercent: Number(event.target.value),
                            })
                          }
                          placeholder="Rend %"
                        />
                      </div>
                      <div className="sm:col-span-2 xl:col-span-2">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Tipo merma
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            value={ingredient.wasteType}
                            onChange={(event) =>
                              updateIngredient(index, { wasteType: event.target.value })
                            }
                            placeholder="Tipo merma"
                          />
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-rose-600"
                            onClick={() => removeIngredient(index)}
                            aria-label="Quitar ingrediente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditorOpen(false)} type="button">
                Cancelar
              </Button>
              <Button
                icon={<Save className="h-4 w-4" />}
                onClick={() => void saveRecipe()}
                disabled={saving}
                type="button"
              >
                {saving ? "Guardando..." : "Guardar receta"}
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
