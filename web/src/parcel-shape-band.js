const PARCELS = [
  "M0 17 88 11 102 55 94 93 4 88Z",
  "M102 55 168 48 178 105 94 112 94 93Z",
  "M4 88 94 93 94 112 105 169 13 160Z",
  "M178 105 265 96 273 159 196 170 105 169 94 112Z",
  "M88 11 175 8 168 48 102 55Z",
  "M175 8 272 14 265 96 178 105 168 48Z",
  "M272 14 362 6 367 74 265 96Z",
  "M273 159 367 151 375 179 282 177Z",
  "M367 74 448 69 455 133 375 145 367 151 367 74Z",
  "M367 151 375 145 455 133 463 177 375 179Z",
  "M448 69 532 63 543 111 455 133Z",
  "M532 63 625 70 621 126 543 111Z",
  "M543 111 621 126 629 171 463 177 455 133Z",
  "M625 70 714 62 724 111 621 126Z",
  "M714 62 808 69 805 133 724 111Z",
  "M724 111 805 133 812 174 629 171 621 126Z",
  "M808 69 891 61 899 109 805 133Z",
  "M891 61 985 66 989 127 899 109Z",
  "M899 109 989 127 1000 173 812 174 805 133Z",
  "M985 66 1075 58 1080 107 989 127Z",
  "M1075 58 1168 62 1171 121 1080 107Z",
  "M1080 107 1171 121 1200 166 1000 173 989 127Z",
  "M2 88 4 18M273 159 282 177M448 69 455 133M714 62 724 111M985 66 989 127",
];

const NS = "http://www.w3.org/2000/svg";

function parcelArtwork() {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 1200 180");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  for (const [index, d] of PARCELS.entries()) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("class", index % 5 === 0 ? "shape-line shape-line--quiet" : "shape-line");
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

  if (!band.querySelector("svg")) {
    const track = document.createElement("div");
    track.className = "parcel-shape-band-track";
    track.append(parcelArtwork(), parcelArtwork());
    band.append(track);
  }
}
