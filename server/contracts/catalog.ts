/**
 * Contratos DTO de Catálogo Público y Especies.
 * Nunca exponen documentos privados, correos ni credenciales.
 */

export interface SpeciesDto {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  illustrationColor: string;
  suggestedPriceCop: number;
  suggestedLengthCm: number;
  banned: boolean;
  minimumLengthCm: number;
  simulatedLengthCm: number;
}

export interface CatalogLotDto {
  id: string;
  speciesId: string;
  name: string;
  scientific: string;
  description: string;
  color: string;
  price: number;
  stock: number;
  pieceWeightGrams?: number;
  length: number;
  minimum: number;
  zone: string;
  method: string;
  capturedAt: string;
  landedAt: string;
  temperature: number;
  photo: string;
  paused: boolean;
  banned: boolean;
  fisherId: string;
  fisher: string;
  member: string;
  version: number;
}

export interface CatalogQueryFilters {
  speciesId?: string;
  zone?: string;
  fisherId?: string;
  unitMode?: 'kg' | 'piece';
  search?: string;
}
