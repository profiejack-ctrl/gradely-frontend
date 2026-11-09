import { MatrixCategory } from '../api/types';

/**
 * Normalizes grading matrix categories whether the incoming matrix is:
 * - An array of MatrixCategory
 * - A JSON string
 * - An object containing { categories: MatrixCategory[], useTransmutation?: boolean }
 * - Null / undefined / invalid
 */
export const normalizeMatrixCategories = (matrix: any): MatrixCategory[] => {
  if (!matrix) return [];
  if (Array.isArray(matrix)) return matrix;
  if (typeof matrix === 'string') {
    try {
      const parsed = JSON.parse(matrix);
      return normalizeMatrixCategories(parsed);
    } catch {
      return [];
    }
  }
  if (typeof matrix === 'object' && Array.isArray(matrix.categories)) {
    return matrix.categories;
  }
  return [];
};
