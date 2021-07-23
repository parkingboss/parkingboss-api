import { Payload } from './Payload';

export interface PolicyPayload extends Payload {
  policy: string;
  amenity: string;
}
