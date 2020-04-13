export interface PropertiesPayload {
  properties: {
    count: number;
    item?: string;
    items: Record<string, string>;
  };
}
