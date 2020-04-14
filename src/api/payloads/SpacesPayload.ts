import { Payload } from './Payload';

export interface SpacesPayload extends Payload {
  locations: {
    item?: string;
    items: Record<string, string>;
  };
  spaces: { enabled: false } | {
    enabled: true;
    scope: string;
    permits: boolean;
    predefined: boolean;
    title: string;
    count: number;
    items: Record<string, string>;
  };
}
