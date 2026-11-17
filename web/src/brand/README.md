# Brand: the heavy element in 3D

| File | What it is |
|---|---|
| `heavy-element-geometry.js` | The mark as geometry (node, 25 rays, 36 fragments), recovered from `public/heavy-element-mark.png`. Recovery script and process images: `heavymap-restricted/prototypes/heavy-element-3d/` |
| `heavy-element-3d.js` | Canvas renderer, no library. Each ray is tilted out of the page so that depth 0 is exactly the flat logo |
| `title-intro.js` | The map page's opening title sequence (full once per session, short arrival after; skip with Escape, Enter, Space or a click; still mark with reduced motion) |
| `heavy-element-loader.js` | `<heavy-element-loader>`, a reusable loader in two themes and two motions |
| `demo.html` | All four loader variants on one page (serve `web/` over HTTP, open `/src/brand/demo.html`) |

## Using the loader

```html
<script type="module">import "/src/brand/heavy-element-loader.js";</script>   <!-- or import it from a page module -->
<heavy-element-loader theme="dark" mode="spin" loading style="width:120px;height:120px"></heavy-element-loader>
```

- `theme="dark"`: light ink on near-black; the usual web loader. `theme="light"`: dark ink on a pale ground.
- `transparent`: no ground; draws on whatever is behind it.
- `mode="spin"`: arrives spinning and locks into the flat mark, every 2.6 seconds. `mode="drift"`: turns slowly in 3D for as long as loading takes.
- When loading is done, remove the `loading` attribute or call `loader.finish()`: it eases to the front, flattens into the mark and fires `heavy-element-done`.
- Size it with CSS. It pauses when off screen and shows the still mark with reduced motion.
