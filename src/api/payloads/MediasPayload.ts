import { Payload } from './Payload';

export interface MediasPayload extends Payload {
  locations: {
    item?: string;
    items: Record<string, string>;
  };

  media: { enabled: false } | {
    enabled: true;
    scope: string;
    permits: {
      title: string;
      selfservice: { enabled: false } | {
        enabled: true;
        auth: boolean;
        title: string;
      };
      fee: number;
    };
    type: string;
    title: string;
    format: string;
    predefined: boolean;
    unlimited: boolean;
    types: Record<string, string>;
    count: number;
    items: Record<string, string>;
  };
}
