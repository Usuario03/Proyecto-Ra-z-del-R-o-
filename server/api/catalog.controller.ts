import type { CatalogQueryFilters } from '../contracts/catalog';
import { jsonSuccess, toErrorResponse } from '../security/errors';
import { listPublicCatalog, listSpecies } from '../services/catalog';

export async function handleCatalogGet(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const sp = url.searchParams;
    const unitModeRaw = sp.get('unitMode');
    const filters: CatalogQueryFilters = {
      ...(sp.get('speciesId') ? { speciesId: sp.get('speciesId') as string } : {}),
      ...(sp.get('zone') ? { zone: sp.get('zone') as string } : {}),
      ...(sp.get('fisherId') ? { fisherId: sp.get('fisherId') as string } : {}),
      ...(unitModeRaw === 'kg' || unitModeRaw === 'piece'
        ? { unitMode: unitModeRaw }
        : {}),
      ...(sp.get('search') ? { search: sp.get('search') as string } : {}),
    };

    const items = await listPublicCatalog(filters);
    return jsonSuccess({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleSpeciesGet(): Promise<Response> {
  try {
    const items = await listSpecies();
    return jsonSuccess({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}
