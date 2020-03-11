import { each, get } from 'lodash-es';

function itemsToArrays(json: any) {
  each(json, (val) => {
    if (!val) return;
    if (val.items) {
      val.items = Object.keys(val.items).map(id => json.items[id]);
    }
    if (val.item) {
      val.item = json.items[val.item];
    }
  });
}

function normalizeAttachments(attachments: { [key: string]: { [key: string]: string } }, parentId: string, items: { [key: string]: any }) {
  const parent = items[parentId];
  each(attachments, (type, itemId) => {
    const coll = type + 's';
    if (!parent[coll]) parent[coll] = [];
    parent[coll].push(items[itemId]);
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
  itemsToArrays(json);
}
