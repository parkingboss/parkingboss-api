export interface ViolationsPayload {
  violations: {
    issued: { utc: string };
    valid: { utc: string };
    count: number;
    items: Record<string, string>
  }
}
