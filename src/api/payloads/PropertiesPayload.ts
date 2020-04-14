import { Payload } from "./Payload";

export interface PropertiesPayload extends Payload {
  properties: {
    count: number;
    item?: string;
    items: Record<string, string>;
  };
  addresses: {
    count: number;
    item?: string;
    items: Record<string, string>;
  };
}
