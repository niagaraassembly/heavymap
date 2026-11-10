import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// Local design preview only; no deployment or publication configuration.
export default defineConfig({
  base: "./",
  server: { host: "127.0.0.1" },
  build: {
    rollupOptions: {
      input: {
        site: fileURLToPath(new URL("./index.html", import.meta.url)),
        alternate: fileURLToPath(new URL("./alternate.html", import.meta.url)),
        map: fileURLToPath(new URL("./map.html", import.meta.url)),
      },
    },
  },
});
