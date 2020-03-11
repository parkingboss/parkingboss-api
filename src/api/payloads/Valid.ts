import { Time } from './Time';

export interface Valid {
  interval?: string;
  utc?: string;
  local?: string;
  min?: string | Time | false;
  max?: string | Time | false;
}
