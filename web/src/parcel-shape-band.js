// A deliberately varied set of isolated parcel silhouettes, not a street grid.
const PARCELS = [
  { d: "M34 105 49 53 89 28 145 39 136 91 151 136 93 153 58 139Z", color: "#fffaf0" },
  { d: "M229 26 294 44 311 100 280 151 231 126 204 76Z", color: "#ff914d" },
  { d: "M385 36 466 30 466 76 497 76 497 143 423 153 423 104 375 104Z", color: "#fffaf0" },
  { d: "M572 45 630 28 670 44 689 88 651 101 665 144 607 150 598 106 557 91Z", color: "#fffaf0" },
  { d: "M753 30 835 38 849 64 827 78 845 119 794 151 761 127 779 91 738 68Z", color: "#ff914d" },
  { d: "M927 43 990 23 1025 51 1007 83 1035 112 1017 151 956 142 941 108 912 92Z", color: "#fffaf0" },
  { d: "M1122 113 1134 49 1183 30 1219 49 1199 89 1230 129 1185 151 1150 132Z", color: "#fffaf0" },
  { d: "M1318 25 1364 25 1364 62 1416 62 1416 111 1364 111 1364 150 1318 150 1318 109 1287 109 1287 67 1318 67Z", color: "#ff914d" },
  { d: "M1517 33 1572 24 1593 63 1577 92 1600 130 1551 153 1510 129 1528 91 1496 67Z", color: "#fffaf0" },
];

const NS = "http://www.w3.org/2000/svg";

function parcelArtwork() {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 1600 180");
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

/** Add a decorative, keyless parcel gallery to the map's viewport. */
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
}
