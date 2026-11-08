import { defineConfig } from "vite";

// Local Range support lets the synthetic PMTiles exercise real partial reads.
// There is deliberately no deploy configuration or publishing script.
export default defineConfig({ base: "./", server: { host: "127.0.0.1" } });
