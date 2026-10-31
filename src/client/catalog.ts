import type {
  CreateCaptureLotInput,
  UpdateLotInventoryInput,
} from '../../server/contracts/capture';
import type {
  CatalogLotDto,
  CatalogQueryFilters,
  SpeciesDto,
} from '../../server/contracts/catalog';
import type {
  EnvironmentalAuditDto,
  EnvironmentalRuleDto,
  UpdateEnvironmentalRuleInput,
} from '../../server/contracts/environment';
import type { UserProfileDto } from '../../server/contracts/profile';
import { apiRequest } from './api';
import { getClientJwtToken } from './session';

export async function fetchCatalogFromApi(
  filters: CatalogQueryFilters = {},
): Promise<CatalogLotDto[]> {
  const res = await fetchCatalogAndFishermenFromApi(filters);
  return res.items;
}

export async function fetchCatalogAndFishermenFromApi(
  filters: CatalogQueryFilters = {},
): Promise<{ items: CatalogLotDto[]; fishermen: UserProfileDto[] }> {
  const params = new URLSearchParams();
  if (filters.speciesId) params.set('speciesId', filters.speciesId);
  if (filters.zone) params.set('zone', filters.zone);
  if (filters.fisherId) params.set('fisherId', filters.fisherId);
  if (filters.unitMode) params.set('unitMode', filters.unitMode);
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();

  const res = await apiRequest<{ items: CatalogLotDto[]; fishermen?: UserProfileDto[] }>(
    `/api/catalog${query ? `?${query}` : ''}`,
  );
  return { items: res.items, fishermen: res.fishermen ?? [] };
}

export async function fetchSpeciesFromApi(): Promise<SpeciesDto[]> {
  const res = await apiRequest<{ items: SpeciesDto[] }>('/api/species');
  return res.items;
}

export async function fetchEnvironmentalRulesFromApi(): Promise<EnvironmentalRuleDto[]> {
  const res = await apiRequest<{ items: EnvironmentalRuleDto[] }>('/api/environment/rules');
  return res.items;
}

export async function fetchMyFisherLotsFromApi(): Promise<CatalogLotDto[]> {
  const res = await apiRequest<{ items: CatalogLotDto[] }>('/api/lots', {
    method: 'GET',
    token: getClientJwtToken(),
  });
  return res.items;
}

export async function publishCaptureInApi(
  input: CreateCaptureLotInput,
): Promise<CatalogLotDto> {
  return apiRequest<CatalogLotDto>('/api/lots', {
    method: 'POST',
    body: input,
    token: getClientJwtToken(),
  });
}

export async function updateLotInventoryInApi(
  lotId: string,
  input: UpdateLotInventoryInput,
): Promise<CatalogLotDto> {
  return apiRequest<CatalogLotDto>(`/api/lots/${encodeURIComponent(lotId)}`, {
    method: 'PATCH',
    body: input,
    token: getClientJwtToken(),
  });
}

export async function withdrawLotInApi(lotId: string): Promise<void> {
  await apiRequest<void>(`/api/lots/${encodeURIComponent(lotId)}`, {
    method: 'DELETE',
    token: getClientJwtToken(),
  });
}

export async function updateEnvironmentalRuleInApi(
  speciesId: string,
  input: UpdateEnvironmentalRuleInput,
): Promise<EnvironmentalRuleDto> {
  return apiRequest<EnvironmentalRuleDto>(
    `/api/environment/rules/${encodeURIComponent(speciesId)}`,
    {
      method: 'PATCH',
      body: input,
      token: getClientJwtToken(),
    },
  );
}

export async function fetchEnvironmentalAuditFromApi(
  limit = 20,
): Promise<EnvironmentalAuditDto[]> {
  const res = await apiRequest<{ items: EnvironmentalAuditDto[] }>(
    `/api/environment/audit?limit=${limit}`,
    {
      method: 'GET',
      token: getClientJwtToken(),
    },
  );
  return res.items;
}
