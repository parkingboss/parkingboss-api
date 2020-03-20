export interface PropertiesPayload {
  locations: {
    count: number;
    items: Record<string, string>;
  };
  addresses: {
    count: number;
    items: Record<string, string>;
  };
}
