import { isAfter, isWithinInterval, isBefore } from 'date-fns';
import { Valid } from './api/payloads/Valid';

export interface Interval {
  start?: Date;
  end?: Date;
}

function intervalMin(valid: Valid): undefined | Date {
  if (!valid) return;

  if (valid.min) {
    return new Date(typeof valid.min === 'string' ? valid.min : valid.min.utc);
  } else if (valid.interval && valid.interval.split) {
    let val = valid.interval.split('/')[0];
    if (val) return new Date(val);
  }
}

function intervalMax(valid: Valid): undefined | Date {
  if (!valid) return;

  if (valid.max) {
    return new Date(typeof valid.max === 'string' ? valid.max : valid.max.utc);
  } else if (valid.interval && valid.interval.split) {
    let val = valid.interval.split('/')[1];
    if (val) return new Date(val);
  }
}

export function validToInterval(valid: Valid): Interval {
  const start = intervalMin(valid);
  const end = intervalMax(valid);

  return { start, end };
}

export function intervalIsValid(interval: Interval, now?: Date) {
  if (!interval) return false;

  now = now || new Date();

  if (interval.end && interval.start) {
    return isWithinInterval(now, interval as any);
  } else if (interval.end) {
    return isAfter(interval.end, now);
  } else if (interval.start) {
    return isAfter(now, interval.start);
  }
}

export function isValid(valid: Valid, now?: Date) {
  now = now || new Date();

  const interval = validToInterval(valid);

  return intervalIsValid(interval, now);
}

export function isInterval(x: any): x is Interval {
  return x && (x.start instanceof Date || x.end instanceof Date);
}

export function intervalString(interval: Interval) {
  const { start, end } = interval;

  const startStr = start ? start.toISOString() : "";
  const endStr = end ? end.toISOString() : "";

  return `${startStr}/${endStr}`;
}
