export type IdString = string;
export type TypeString = string;

export interface Entity {
  id: IdString;
  type: TypeString;
  generated?: string | Date;
  updated?: string | Date;
}

export type Attachment = Record<IdString, TypeString>;

export type Items<T> = Record<IdString, T>;

export type EntityItems = Items<Entity>;
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
}
