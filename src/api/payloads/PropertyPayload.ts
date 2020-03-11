export interface PropertyPayload {
  locations: {
    item?: string;
    items: Record<string, string>;
  };

  addresses: {
    item?: string;
    items: Record<string, string>;
  };
}
