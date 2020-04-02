import { get, set, unset, each, fromPairs, toPairs } from 'lodash-es';

// TODO: This works. It'd be better if we added types. Maybe.
//       Reevaluate if it becomes an issue

const attachmentKeys = new Set(['files', 'notes', 'contacts']);

function traverse(obj: any, fn: (val: any, path: string[]) => any, path: string[] = []) {
  each(obj, (val: any, key: string) => {
    const newPath = [...path, key];
    if (fn(val, newPath)) {
      traverse(val, fn, newPath);
    }
  });
}

function getParentId(child: any, key: string, json: any) {
  if (child.subject) return child.subject;

  if (key !== 'items') return key;

  const item = json.items[child.id].id;
  if (child.type !== item.type) return item.id;

  return null;
}

function modernizeAttachmentType(json: any, collection: any) {
  const attachments = json[collection];

  traverse(attachments, (val: any, path: string[]) => {
    if (!val.type) return true;
    const parentId = getParentId(val, path[path.length - 2], json)

    let oldId = null;
    if (val.id === val.subject || (parentId === 'items' && get(json, ['items', val.id]).id)) {
      oldId = val.id;
      val.id = `${val.id}-${val.type}`;
    }
    set(json, ['items', val.id], val);
    if (parentId !== 'items') {
      set(json, ['attachments', 'items', parentId, val.id], val.type);
      if (oldId) {
        unset(json, ['attachments', 'items', parentId, oldId]);
        unset(json, [collection, 'items', oldId]);
        set(json, [collection, 'items', val.id], val);
      }
    }
  });
}

function modernizeAttachments(json: any, keys: string[]) {
  keys.filter(k => attachmentKeys.has(k))
    .forEach(key => modernizeAttachmentType(json, key));
}

function modernizeItems(json: any, keys: string[]) {
  keys.filter(k => !attachmentKeys.has(k))
    .forEach(key => {
      const items = get(json, [key, 'items'], {});
      Object.assign(json.items, items);
      set(json, [key, 'items'], fromPairs(Object.keys(items).map(x => [x,x])));
    });
}

export function modernize(json: any, ...keys: string[]) {
  if (!json.attachments) json.attachments = { items: {} };
  if (!json.items) json.items = {};

  modernizeItems(json, keys);
  modernizeAttachments(json, keys);

  const types = get(json, 'media.types', {});
  each(types, mt => { mt.type = 'media-type'; });
  Object.assign(json.items, types);
}
