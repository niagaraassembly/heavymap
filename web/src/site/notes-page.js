/* Standalone Notes page (BL-118 follow-up).
 *
 * Every note on this device, grouped by parcel, plus the unassociated
 * notes in their own General group. Notes are created from a parcel (in
 * the workspace Notes tab) or here, with no parcel; this page never
 * creates a parcel-linked note. Deleting here removes the note everywhere:
 * the same device-only store backs the workspace.
 *
 * The page shell is static HTML from pages.js; this mounts the list from
 * localStorage. Without JavaScript the empty state shows, which is the
 * honest state: the notes live only in this browser.
 */

import { el } from "../dossier.js";
import { createNotesStore, formatNoteTime } from "../parcel-notes.js";

function noteItem(note, store) {
  const li = el("li", undefined, "hm-notes-note");
  li.append(el("p", note.text));
  const meta = el("small");
  meta.append(document.createTextNode(formatNoteTime(note.at)));
  meta.append(document.createTextNode(" · "));
  const del = el("button", "Delete note", "hm-notes-delete");
  del.addEventListener("click", () => store.remove(note.id));
  meta.append(del);
  li.append(meta);
  return li;
}

function countText(n) {
  return `${n} ${n === 1 ? "note" : "notes"}`;
}

/** One group: a parcel group with its Open-parcel link, or the General group. */
function groupSection({ title, sub, link }, notes, store) {
  const section = el("section", undefined, "hm-notes-group");
  section.append(el("h2", title));
  if (sub) section.append(el("p", sub, "hm-notes-group-sub"));
  if (link) {
    const open = el("a", "Open parcel", "hm-notes-open");
    open.href = link;
    section.append(open);
  }
  const list = el("ul", undefined, "hm-notes-list");
  for (const note of notes) list.append(noteItem(note, store));
  section.append(list);
  return section;
}

export function mountNotesPage(root) {
  let storage = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  const store = createNotesStore(storage);
  const area = root.querySelector("[data-notes-compose] textarea");
  const add = root.querySelector("[data-notes-add]");
  const empty = root.querySelector("[data-notes-empty]");
  const groupsEl = root.querySelector("[data-notes-groups]");

  function render() {
    const general = store.general();
    const groups = store.groups();
    const total =
      general.length + groups.reduce((n, g) => n + g.notes.length, 0);
    empty.hidden = total > 0;
    groupsEl.replaceChildren();
    if (general.length) {
      groupsEl.append(
        groupSection(
          {
            title: "General notes",
            sub: `${countText(general.length)} with no parcel`,
          },
          general,
          store,
        ),
      );
    }
    for (const group of groups) {
      const sub = [group.parcel.locality, countText(group.notes.length)]
        .filter(Boolean)
        .join(" · ");
      groupsEl.append(
        groupSection(
          { title: group.parcel.title, sub, link: group.parcel.link },
          group.notes,
          store,
        ),
      );
    }
  }

  add.addEventListener("click", () => {
    const note = store.add({ key: null, text: area.value });
    if (note) {
      area.value = "";
      area.focus();
    }
  });
  store.subscribe(render);
  render();
}
