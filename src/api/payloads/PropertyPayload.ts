import { Payload } from './Payload';

export interface PropertyPayload extends Payload {
  properties: {
    item?: string;
    items: Record<string, string>;
  };
}
