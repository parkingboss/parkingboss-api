export type IdString = string;
export type TypeString = string;

export interface Entity {
  id: IdString;
  type: TypeString;
  generated?: string | Date;
  updated?: string | Date;
  [key: string]: unknown;
}

export type Attachment = Record<IdString, TypeString>;

export type Items<T> = Record<IdString, T>;
export type ItemPayload<T extends Payload> = Record<string, T[keyof T]>;

// Include all implementations of the Payload interface
export type EntityItems = Items<Entity> & ItemPayload<any>;
export type AttachmentItems = Items<Attachment>;

export interface Attachments {
  items: AttachmentItems;
}

export interface Payload  {
  generated: string;
  server: string;
  viewpoint: string;
  version?: string;
  items: EntityItems;
  attachments?: Attachments;
  scope?: string;
}
