import { Payload } from './Payload';

export interface PoliciesPayload extends Payload {
  policies: {
    item: string
  }
}
