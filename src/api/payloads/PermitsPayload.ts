import { Payload } from './Payload';

export interface PermitsPayload extends Payload {
  permits: {
    issued: string;
    valid: string;
    count: number;
    items: Record<string, string>;
  };
}
