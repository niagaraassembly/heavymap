// Geometry-only sample from the City of Hamilton Assessment Parcel layer (2026-10-17).
// The outlines are selected for shape variety; parcel keys and all attributes are omitted.
const PARCELS = [
  { d: "M136.8 33.7 139.0 76.8 127.7 84.2 124.6 92.6 109.8 85.3 70.7 95.4 56.9 114.0 54.6 124.9 59.9 136.2 26.2 146.3 21.0 125.3 34.0 121.0 36.8 102.2 53.7 81.1 125.7 62.2 134.7 48.7Z", color: "#fffaf0" },
  { d: "M260.9 24.0 288.0 137.2 209.0 156.0 192.0 93.1 220.0 64.7 213.1 35.9Z", color: "#fffaf0" },
  { d: "M459.0 55.0 446.0 118.1 414.0 116.2 341.0 130.7 363.3 60.3 446.8 49.3Z", color: "#ff914d" },
  { d: "M513.4 86.2 594.4 51.9 619.0 33.0 545.4 118.1 511.4 147.0 501.0 116.3Z", color: "#fffaf0" },
  { d: "M768.1 54.3 758.6 56.7 753.7 80.4 751.1 86.7 719.3 126.8 701.1 144.9 684.4 156.0 671.9 100.0 684.4 89.5 694.9 84.5 701.3 86.6 720.9 57.6 733.7 41.8 742.7 38.0 740.1 27.0 760.8 24.0Z", color: "#fffaf0" },
  { d: "M855.1 140.7 853.0 141.0 854.6 136.7 853.6 130.7 821.0 80.3 824.0 75.2 835.7 67.4 832.3 64.5 838.2 61.0 845.4 62.4 840.2 38.0 851.3 35.3 924.8 43.5 939.0 74.4 924.7 144.7 886.9 136.0Z", color: "#ff914d" },
  { d: "M1012.0 47.9 1029.1 122.2 1097.1 105.9 1099.0 114.2 1024.2 132.1 1019.8 124.4 998.0 129.6 981.0 56.0Z", color: "#fffaf0" },
  { d: "M1210.1 64.1 1241.3 73.9 1242.1 85.2 1247.0 89.9 1254.7 86.2 1251.7 77.2 1259.0 79.5 1250.9 101.4 1214.7 91.5 1201.4 131.3 1141.0 113.4 1160.8 48.7 1199.8 60.9 1200.7 72.7 1205.3 76.8 1213.5 72.2Z", color: "#fffaf0" },
  { d: "M1343.4 140.0 1363.0 79.0 1357.7 68.2 1376.0 24.0 1412.4 38.1 1392.5 83.5 1376.1 78.2 1348.5 156.0 1307.6 142.9 1311.0 132.1Z", color: "#fffaf0" },
  { d: "M1509.6 24.0 1523.5 54.5 1548.0 78.6 1564.6 74.7 1579.0 136.8 1497.5 156.0 1477.0 65.6 1478.2 65.3 1476.7 58.9 1466.9 61.3 1461.0 35.5Z", color: "#ff914d" },
  { d: "M1737.3 82.8 1697.4 136.3 1678.1 125.9 1673.7 138.4 1653.5 131.2 1659.0 115.5 1621.0 94.7 1631.9 80.2 1648.9 93.3 1687.6 41.6 1739.0 80.5Z", color: "#fffaf0" },
  { d: "M1861.7 35.6 1881.9 49.5 1899.0 120.3 1798.1 144.4 1781.0 73.5 1843.6 58.6Z", color: "#fffaf0" },
  { d: "M2053.9 79.3 1994.4 61.1 1986.1 62.1 1981.8 67.8 1968.0 113.1 1964.7 141.6 1962.0 143.9 1941.0 140.6 1973.9 36.1 2059.0 62.5Z", color: "#ff914d" },
  { d: "M2138.8 137.6 2133.5 139.1 2126.5 153.6 2101.0 145.1 2133.4 43.4 2178.1 56.9 2190.1 26.4 2194.6 27.9 2192.3 35.0 2212.9 38.6 2206.8 58.3 2219.0 64.4 2200.2 125.3 2168.2 111.2 2171.2 101.8 2156.4 122.0Z", color: "#fffaf0" },
  { d: "M2296.3 24.0 2310.1 28.7 2294.7 78.7 2374.6 106.0 2359.1 156.0 2265.4 124.0Z", color: "#fffaf0" },
  { d: "M2437.9 134.6 2421.0 109.5 2529.1 45.4 2539.0 63.0 2473.4 102.2 2478.4 110.9Z", color: "#fffaf0" },
  { d: "M2608.2 44.0 2678.2 65.0 2669.9 94.4 2622.5 80.2 2612.5 72.7 2604.9 75.0 2602.7 82.6 2607.8 88.6 2620.2 87.8 2697.0 110.8 2699.0 114.6 2692.3 138.5 2581.0 102.3 2599.7 41.5Z", color: "#ff914d" },
  { d: "M2851.9 84.4 2835.8 79.0 2833.9 94.9 2851.1 96.5 2849.8 115.3 2834.0 113.3 2830.2 151.6 2791.4 139.7 2789.2 156.0 2748.1 142.1 2765.3 131.3 2811.9 71.0 2792.0 64.4 2802.0 53.6 2824.8 60.5 2849.5 24.0Z", color: "#fffaf0" },
  { d: "M2937.6 31.6 3019.0 47.9 3008.0 91.1 3016.2 93.0 2997.5 148.4 2972.5 139.8 2996.1 67.5 2971.7 60.4 2948.2 131.6 2901.0 115.5 2908.0 94.6 2917.3 91.9Z", color: "#fffaf0" },
  { d: "M3132.8 28.1 3122.3 63.1 3146.3 70.5 3157.2 35.7 3169.4 39.5 3135.8 147.2 3113.1 156.0 3070.6 142.2 3096.5 59.0 3107.5 62.4 3119.4 24.0Z", color: "#ff914d" },
  { d: "M3323.3 29.9 3339.0 34.9 3316.1 108.0 3234.3 150.1 3221.0 137.7 3302.7 95.6Z", color: "#fffaf0" },
  { d: "M3398.1 24.0 3411.0 27.8 3411.6 31.3 3446.3 39.2 3490.2 70.7 3486.5 77.6 3485.2 98.3 3468.0 156.0 3395.2 134.1 3391.2 126.7 3393.8 117.7 3392.5 115.4 3401.1 65.8 3389.8 51.1Z", color: "#fffaf0" },
  { d: "M3641.6 57.6 3604.8 111.2 3623.0 123.8 3600.9 155.8 3589.7 144.4 3576.7 134.9 3541.0 120.6 3557.1 71.4 3595.0 97.7 3609.7 76.3 3618.8 82.6 3659.0 24.2 3657.4 34.7Z", color: "#fffaf0" },
  { d: "M3804.3 24.0 3818.6 84.9 3797.9 89.5 3809.2 137.8 3727.4 156.0 3701.4 44.8Z", color: "#ff914d" },
  { d: "M3881.3 49.1 3889.7 88.0 3910.0 83.1 3909.1 79.1 3929.4 74.1 3930.3 78.1 3970.8 67.8 3979.0 105.7 3877.6 130.9 3861.0 54.1Z", color: "#fffaf0" },
  { d: "M4095.0 92.5 4043.9 135.0 4042.7 121.3 4036.9 116.2 4028.1 102.3 4021.0 70.1 4022.4 62.0 4025.2 58.1 4046.0 58.6 4057.7 53.1 4061.2 54.2 4079.1 49.3 4091.6 48.9 4095.5 45.0 4135.4 45.3 4139.0 58.9Z", color: "#fffaf0" },
  { d: "M4208.9 48.8 4250.5 56.1 4270.1 62.7 4293.1 65.7 4299.0 127.2 4296.7 131.2 4220.2 128.9 4220.4 119.7 4181.0 52.4 4193.1 50.1 4198.5 55.3Z", color: "#ff914d" },
  { d: "M4406.8 24.3 4418.0 28.0 4431.7 45.5 4459.0 54.4 4424.6 155.7 4349.3 131.0 4357.0 107.5 4341.0 102.3 4346.9 84.0 4351.3 85.4 4361.7 53.4 4370.2 54.4 4374.1 53.3 4382.3 55.2 4396.2 39.9 4400.2 26.8Z", color: "#fffaf0" },
  { d: "M4529.1 75.8 4501.0 62.8 4515.8 47.6 4537.3 54.1 4572.3 88.7 4575.6 110.4 4583.8 117.2 4590.4 112.3 4611.1 128.3 4619.0 128.2 4610.6 132.4 4596.8 120.4 4578.6 126.1Z", color: "#fffaf0" },
  { d: "M4671.8 81.9 4665.8 51.9 4661.0 43.5 4779.0 77.0 4778.1 80.6 4715.6 63.3 4692.6 135.2 4686.7 136.5 4679.0 104.3 4673.9 96.5 4666.3 91.1Z", color: "#fffaf0" },
  { d: "M4891.1 118.6 4821.0 92.1 4839.5 32.6 4845.1 32.8 4937.2 113.2 4939.0 119.6 4935.1 132.0 4912.7 125.0 4905.5 147.4 4885.1 140.0Z", color: "#ff914d" },
  { d: "M5099.0 54.0 5064.4 79.2 5019.7 120.1 4985.3 138.3 4981.0 119.5 5003.5 113.6 5059.9 61.4 5077.2 49.7 5096.2 41.7Z", color: "#fffaf0" },
  { d: "M5177.3 24.0 5257.4 51.7 5249.0 77.1 5252.7 78.4 5247.1 87.9 5197.7 70.9 5185.9 106.6 5227.6 121.0 5215.9 156.0 5142.6 130.7Z", color: "#fffaf0" },
  { d: "M5342.1 81.0 5370.5 128.7 5419.0 139.9 5343.8 141.9 5301.0 49.7 5323.2 38.1Z", color: "#ff914d" },
  { d: "M5579.0 78.6 5555.5 85.1 5544.8 91.6 5538.3 99.3 5516.5 136.7 5511.8 134.0 5506.1 127.0 5494.2 138.5 5481.6 124.8 5497.5 102.2 5496.2 92.8 5490.0 83.9 5480.8 79.6 5461.6 77.0 5461.0 71.9 5571.7 41.5Z", color: "#fffaf0" },
  { d: "M5726.0 64.8 5739.0 68.4 5720.9 121.2 5735.7 129.8 5733.6 136.6 5649.5 106.3 5644.9 118.1 5643.4 109.1 5621.0 93.5 5639.7 97.5 5648.0 43.4 5661.0 47.0 5653.8 59.6 5658.7 66.3 5719.8 82.8 5726.4 77.9Z", color: "#fffaf0" },
];

const CELL_WIDTH = 160;
const VIEWBOX_HEIGHT = 180;
const SCREENS_PER_ARTWORK = 4;
const MIN_ARTWORK_WIDTH = 3600;
const SCROLL_PIXELS_PER_SECOND = 142;
const NS = "http://www.w3.org/2000/svg";

function parcelArtwork() {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${PARCELS.length * CELL_WIDTH} ${VIEWBOX_HEIGHT}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  for (const { d, color } of PARCELS) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "1.7");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("opacity", "0.98");
    svg.append(path);
  }
  return svg;
}

function sizeArtwork(track) {
  const width = Math.max(window.innerWidth * SCREENS_PER_ARTWORK, MIN_ARTWORK_WIDTH);
  for (const svg of track.querySelectorAll("svg")) {
    svg.style.width = `${width}px`;
    svg.style.flex = `0 0 ${width}px`;
  }
  track.style.setProperty("--parcel-shapes-duration", `${width / SCROLL_PIXELS_PER_SECOND}s`);
}

/** Add a geometry-only parcel gallery; the first map interaction dismisses it. */
export function mountParcelShapeBand(workspace) {
  if (!workspace) return;

  let band = workspace.querySelector("[data-parcel-shape-band]");
  if (!band) {
    band = document.createElement("div");
    band.className = "parcel-shape-band";
    band.dataset.parcelShapeBand = "";
    band.setAttribute("aria-hidden", "true");
    workspace.append(band);
  }

  let track = band.querySelector(".parcel-shape-band-track");
  if (!track) {
    track = document.createElement("div");
    track.className = "parcel-shape-band-track";
    band.append(track);
  }
  if (!track.querySelector("svg")) track.replaceChildren(parcelArtwork(), parcelArtwork());

  const resizeArtwork = () => sizeArtwork(track);
  const dismiss = () => {
    band.remove();
    window.removeEventListener("resize", resizeArtwork);
  };

  resizeArtwork();
  window.addEventListener("resize", resizeArtwork, { passive: true });
  workspace.querySelector("#map")?.addEventListener("pointerdown", dismiss, { once: true });
}
