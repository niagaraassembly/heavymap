/** Shared catalogue shell for map provenance, release records, and methods. */
export function mapDataLibraryPage() {
  return {
    path: "/map/data-methods/",
    title: "Map data & methods",
    description: "Sources, map releases, preparation methods, and loading decisions for HeavyMap maps.",
    bodyClass: "hm-map-library-page",
    main: `<section class="hm-map-library" data-map-library aria-labelledby="map-library-title">
      <div class="hm-map-library-topbar">
        <a class="hm-library-back" href="/map/">← Back to the map</a>
        <div class="hm-library-actions" aria-label="Document options">
          <button type="button" data-library-copy>Copy link</button>
          <button type="button" data-library-print>Print</button>
          <a href="/map/data-methods/catalogue.json" download>Download catalogue</a>
        </div>
      </div>
      <header class="hm-map-library-heading"><p class="eyebrow">HeavyMap · Map records</p><h1 id="map-library-title">Data <em>&amp; methods.</em></h1><p>Source records, layer notes, release histories, and the decisions behind each map. Filter by place or topic, then open a record beside the catalogue.</p></header>
      <div class="hm-map-library-workspace">
        <aside class="hm-library-filters" aria-label="Filter map documents">
          <label for="map-library-search">Search</label><input id="map-library-search" type="search" placeholder="Search records" autocomplete="off">
          <label for="map-library-city">Place</label><select id="map-library-city"><option value="all">All places</option></select>
          <label for="map-library-topic">Topic</label><select id="map-library-topic"><option value="all">All topics</option></select>
          <label for="map-library-kind">Record type</label><select id="map-library-kind"><option value="all">All types</option></select>
          <p class="hm-library-count" id="map-library-count" role="status">Loading records…</p>
          <nav id="map-document-toc" class="hm-library-toc" aria-label="Sections in this document" hidden><h2>In this document</h2><ol></ol></nav>
        </aside>
        <section class="hm-library-list-panel" aria-label="Map documents">
          <header><h2>Documents</h2><span id="map-library-range"></span></header>
          <ol id="map-library-list" class="hm-library-list"></ol>
          <button type="button" id="map-library-more" class="hm-library-more" hidden>Show more</button>
        </section>
        <article id="map-document-viewer" class="hm-document-viewer" aria-live="polite" aria-label="Selected map document">
          <div class="hm-document-toolbar"><a href="/map/">← Map</a><span id="map-document-position"></span><button type="button" data-library-copy>Copy link</button><button type="button" data-library-print>Print</button></div>
          <div class="hm-document-body"><p class="eyebrow">Map documentation</p><h2>Choose a record</h2><p>Use the filters to browse map sources, layer releases, preparation notes, and performance decisions.</p></div>
        </article>
      </div>
    </section>`,
  };
}
