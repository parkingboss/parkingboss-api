import { Payload } from './Payload';

export interface AuthorizationsPayload extends Payload {
  authorizations: {
    system?: true;
    count: number;
    item?: string;
    items: Record<string, string>;
    valid: string;
  };

  users: {
    item?: string;
    items: Record<string, string>;
  }
}
