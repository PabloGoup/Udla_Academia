import type { RawMaterial, Recipe, RecipeIngredient } from "@/lib/types";

export interface IngredientCostBreakdown {
  id: string;
  name: string;
  grossQuantity: number;
  netQuantity: number;
  wasteQuantity: number;
  realNetUnitCost: number;
  ingredientCost: number;
  yieldPercent: number;
  wasteType: string;
}

export interface RecipeCostSummary {
  grossCost: number;
  netCost: number;
  costPerPortion: number;
  foodCostPercent: number;
  suggestedPrice: number;
  margin: number;
  profitability: number;
  ingredients: IngredientCostBreakdown[];
}

export const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value));
}

export function formatPercent(value: number) {
  return `${numberFormatter.format(value)}%`;
}

export function calculateNetQuantity(grossQuantity: number, yieldPercent: number) {
  return grossQuantity * (yieldPercent / 100);
}

export function calculateWasteQuantity(
  grossQuantity: number,
  yieldPercent: number,
) {
  return grossQuantity - calculateNetQuantity(grossQuantity, yieldPercent);
}

export function calculateRealNetUnitCost(material: RawMaterial) {
  const usableQuantity = calculateNetQuantity(
    material.purchaseQuantity,
    material.averageYield,
  );

  if (usableQuantity <= 0) {
    return 0;
  }

  return material.purchaseCost / usableQuantity;
}

export function calculateIngredientCost(
  ingredient: RecipeIngredient,
  material: RawMaterial,
): IngredientCostBreakdown {
  const netQuantity = calculateNetQuantity(
    ingredient.grossQuantity,
    ingredient.yieldPercent,
  );
  const wasteQuantity = calculateWasteQuantity(
    ingredient.grossQuantity,
    ingredient.yieldPercent,
  );
  const realNetUnitCost = calculateRealNetUnitCost(material);

  return {
    id: ingredient.id,
    name: ingredient.name,
    grossQuantity: ingredient.grossQuantity,
    netQuantity,
    wasteQuantity,
    realNetUnitCost,
    ingredientCost: netQuantity * realNetUnitCost,
    yieldPercent: ingredient.yieldPercent,
    wasteType: ingredient.wasteType,
  };
}

export function calculateRecipeSummary(
  recipe: Recipe,
  rawMaterials: RawMaterial[],
): RecipeCostSummary {
  const ingredients = recipe.ingredients.map((ingredient) => {
    const material = rawMaterials.find(
      (item) => item.id === ingredient.rawMaterialId,
    );

    if (!material) {
      return {
        id: ingredient.id,
        name: ingredient.name,
        grossQuantity: ingredient.grossQuantity,
        netQuantity: 0,
        wasteQuantity: ingredient.grossQuantity,
        realNetUnitCost: 0,
        ingredientCost: 0,
        yieldPercent: ingredient.yieldPercent,
        wasteType: ingredient.wasteType,
      };
    }

    return calculateIngredientCost(ingredient, material);
  });

  const netCost = ingredients.reduce(
    (total, ingredient) => total + ingredient.ingredientCost,
    0,
  );
  const grossCost = ingredients.reduce(
    (total, ingredient) =>
      total + ingredient.grossQuantity * ingredient.realNetUnitCost,
    0,
  );
  const costPerPortion = netCost / recipe.portions;
  const suggestedPrice = costPerPortion / (recipe.targetFoodCostPercent / 100);
  const foodCostPercent = recipe.salePrice
    ? (costPerPortion / recipe.salePrice) * 100
    : 0;
  const margin = recipe.salePrice - costPerPortion;
  const profitability = recipe.salePrice ? (margin / recipe.salePrice) * 100 : 0;

  return {
    grossCost,
    netCost,
    costPerPortion,
    foodCostPercent,
    suggestedPrice,
    margin,
    profitability,
    ingredients,
  };
}

