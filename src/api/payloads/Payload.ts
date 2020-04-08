export type IdString = string;

export type TypeString = string;

export interface Item {
  id: IdString;
  generated?: string | Date;
  updated?: string | Date;
}

export type ItemAttachments = Record<IdString, TypeString>;

export type Items = Record<IdString, Item>;
export type Attachments = Record<IdString, ItemAttachments>;

export interface Payload {
  generated: string;
  server: string;
  viewpoint: string;
  version?: string;
  items: Items;
  attachments?: Attachments;
}
