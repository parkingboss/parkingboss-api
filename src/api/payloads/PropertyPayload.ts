import { Payload } from './Payload';

export interface PropertyPayload extends Payload {
  locations: {
    item?: string;
    items: Record<string, string>;
  };

  addresses: {
    item?: string;
    items: Record<string, string>;
  };
}
