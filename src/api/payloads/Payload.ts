export interface Payload {
  generated: string;
  server: string;
  viewpoint: string;
  version?: string;
  items: Record<string, unknown>;
  attachments: {
    items: Record<string, Record<string, string>>;
  };
}
