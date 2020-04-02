import { each, get, flatMap, uniq } from 'lodash-es';

function flattenAttachments(
  attachments: { [items: string]: { [key: string]: { [key: string]: any } } | string[] }
) {
  attachments.items = uniq(flatMap(
    attachments.items,
    (attachments) => Object.keys(attachments as object)
  ));
}

function itemsToArrays(json: any) {
  each(json, (val) => {
    if (!val) return;
    if (val.items) {
      val.items = Object.values(val.items).map((id) => get(json, ['items', id as string], id));
    }
    if (val.item) {
      val.item = json.items[val.item];
    }
  });
}

function normalizeAttachments(
  attachments: { [key: string]: string },
  parentId: string,
  items: { [key: string]: any }) {

  const parent = items[parentId];

  each(attachments, (type, itemId) => {

    // make sure the attachment references the parent
    const attachment = items[itemId];
    if (!attachment.subject) attachment.subject = parent;

    // make sure the parent object has a collection of referenced attachments
    const coll = type + 's';
    if (!parent[coll]) parent[coll] = [];
    parent[coll].push(attachment);
  });
}

function normalizeItem(item: any, id: string | null, items: { [key: string]: any }) {
  each(item, (val, key) => {
    const valType = typeof val;
    if (valType == 'object') {
      normalizeItem(val, null, items);
    }
    // Don't assign self!
    if (valType == 'string' && id != val) {
      item[key] = get(items, val, val);
    }
  });
}

export function normalize(json: any) {
  each(json.items, normalizeItem);
  each(json.attachments.items, (attachments, parentId) => normalizeAttachments(attachments, parentId, json.items));
  flattenAttachments(json.attachments);
  itemsToArrays(json);
}
