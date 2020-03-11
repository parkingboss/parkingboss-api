export interface PermitsPayload {
  permits: {
    issued: string;
    valid: string;
    count: number;
    items: Record<string, string>;
  };
}
