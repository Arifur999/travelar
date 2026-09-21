import { type IExpenseCategoryBreakdown } from "@/types/expense.types";

/**
 * Shapes the expense dashboard into what its charts draw. Kept free of React
 * so the fiddly parts — a category with nothing spent, folding the tail,
 * shares that must still add to the whole — have unit tests.
 */

export interface CategorySlice {
  key: string;
  name: string;
  value: number;
  /** Percent of everything spent, 0–100. */
  share: number;
  /** How many categories this slice stands for; more than 1 only for "Other". */
  categories: number;
}

/**
 * At most `limit` slices: the biggest categories by spend, with the tail folded
 * into one "Other" slice so a chart stays readable for an agency with thirty
 * categories.
 *
 * Categories with nothing spent are dropped rather than drawn as invisible
 * slices — they belong on the Category page, which lists every one of them.
 *
 * Folding only happens when it removes at least two, since "Other (1)" is just
 * a category with a worse name. The shares are recomputed here rather than
 * summed from the rows, so they still add up to 100 after folding.
 */
export const buildCategorySlices = (
  byCategory: IExpenseCategoryBreakdown[],
  limit = 5,
): CategorySlice[] => {
  const spent = byCategory.filter((category) => category.total > 0);
  const total = spent.reduce((sum, category) => sum + category.total, 0);
  if (total <= 0) return [];

  const sorted = [...spent].sort((a, b) => b.total - a.total);
  const fold = sorted.length - limit >= 2;
  const shown = fold ? sorted.slice(0, limit) : sorted;
  const rest = fold ? sorted.slice(limit) : [];

  const slices: CategorySlice[] = shown.map((category) => ({
    key: category.id,
    name: category.name,
    value: category.total,
    share: (category.total / total) * 100,
    categories: 1,
  }));

  if (rest.length > 0) {
    const restTotal = rest.reduce((sum, category) => sum + category.total, 0);
    slices.push({
      key: "other",
      name: `Other (${rest.length})`,
      value: restTotal,
      share: (restTotal / total) * 100,
      categories: rest.length,
    });
  }

  return slices;
};

/** Nothing has been spent yet, which is different from having no categories. */
export const isCategoryMixEmpty = (slices: CategorySlice[]) => slices.length === 0;
