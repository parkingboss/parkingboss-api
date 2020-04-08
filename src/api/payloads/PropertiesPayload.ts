import { Payload } from './Payload';

export interface PropertiesPayload extends Payload {
  locations: {
    count: number;
    items: Record<string, string>;
  };
  addresses: {
    count: number;
    items: Record<string, string>;
  };
}
