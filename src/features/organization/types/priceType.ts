export interface PriceTypeSettings {
  id: string;
  name: string;
  description: string | null;
  equivalenceFactor: number;
  inUse: boolean;
}

export interface SavePriceTypeRequest {
  name: string;
  description: string | null;
  equivalenceFactor: number;
}
