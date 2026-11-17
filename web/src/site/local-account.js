import {
  DATA_TYPES,
  clearDataType,
  dataCounts,
  exportDataType,
} from "../local-data.js";

function download(value, type) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `heavymap-${type}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function button(text, className, action) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = text;
  if (className) element.className = className;
  element.addEventListener("click", action);
  return element;
}

export function mountLocalAccount() {
  const dialog = document.getElementById("hm-local-account");
  const opener = document.querySelector("[data-local-account-open]");
  if (!dialog || !opener) return;

  const list = dialog.querySelector("[data-local-data-list]");
  const status = dialog.querySelector("[data-local-account-status]");
  const refresh = async () => {
    list.replaceChildren();
    status.textContent = "Reading this device…";
    try {
      const types = await dataCounts();
      for (const type of types) {
        const item = document.createElement("li");
        item.className = "hm-local-data-item";
        const detail = document.createElement("div");
        detail.className = "hm-local-data-detail";
        const title = document.createElement("strong");
        title.textContent = type.label;
        const description = document.createElement("span");
        description.textContent = type.live
          ? `${type.count} ${type.count === 1 ? "note" : "notes"} · ${type.description}`
          : `${type.description} · Not stored yet`;
        detail.append(title, description);
        item.append(detail);

        const actions = document.createElement("div");
        actions.className = "hm-local-data-actions";
        if (type.live) {
          const exportButton = button("Export", "hm-local-action", async () => {
            try {
              download(await exportDataType(type.id), type.id);
              status.textContent = `${type.label} exported to a file on this device.`;
            } catch (error) {
              status.textContent = `Export failed: ${error.message}`;
            }
          });
          exportButton.disabled = type.count === 0;
          actions.append(exportButton);

          const clearButton = button("Clear", "hm-local-action hm-local-action--clear", () => {
            actions.replaceChildren(
              document.createTextNode(`Delete all ${type.label.toLowerCase()}? `),
              button("Delete", "hm-local-action hm-local-action--clear", async () => {
                try {
                  await clearDataType(type.id);
                  await refresh();
                  status.textContent = `${type.label} cleared from this device.`;
                } catch (error) {
                  status.textContent = `Could not clear data: ${error.message}`;
                }
              }),
              button("Cancel", "hm-local-action", () => refresh()),
            );
          });
          clearButton.disabled = type.count === 0;
          actions.append(clearButton);
        } else {
          const future = document.createElement("span");
          future.className = "hm-local-coming";
          future.textContent = "Coming later";
          actions.append(future);
        }
        item.append(actions);
        list.append(item);
      }
      status.textContent = "Stored only in this browser. Exports download a JSON copy.";
    } catch (error) {
      status.textContent = `Local data is unavailable: ${error.message}`;
      for (const type of DATA_TYPES) {
        const item = document.createElement("li");
        item.className = "hm-local-data-item";
        item.textContent = `${type.label} · Could not read this browser's storage`;
        list.append(item);
      }
    }
  };

  opener.addEventListener("click", async () => {
    if (!dialog.open) dialog.showModal();
    await refresh();
  });
  dialog.querySelector("[data-local-account-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}
