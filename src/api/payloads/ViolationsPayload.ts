import { Payload } from './Payload';

export interface ViolationsPayload extends Payload {
  violations: {
    issued: { utc: string };
    valid: { utc: string };
    count: number;
    items: Record<string, string>
  }
}
