import { ok } from '@/server/api-helpers';
import {
  getCategories,
  getCities,
  getCuisines,
  getDistricts,
} from '@/server/repositories/taxonomy';

/** GET /api/catalog/meta — справочники для панели фильтров. */
export async function GET() {
  return ok({
    categories: getCategories(),
    cuisines: getCuisines(),
    districts: getDistricts(),
    cities: getCities(),
  });
}
