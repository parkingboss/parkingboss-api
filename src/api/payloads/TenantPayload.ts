import { Payload } from './Payload';

export interface TenantPayload extends Payload {
    id?: string;
    subject?: string;
}
