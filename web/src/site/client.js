/* Client behaviour shared by every prebuilt page. Pages work without it;
 * this adds conveniences. Reader and history arrive in build step 4. */
import "./styles.css";

/* Edition cards: "Copy link" copies the card's permalink. */
document.addEventListener("click", async (e) => {
  const button = e.target.closest?.("[data-copy-link]");
  if (!button) return;
  const id = button.getAttribute("data-copy-link").replace(/^wny-/, "");
  const url = `${location.origin}/read/${encodeURIComponent(id)}/`;
  try {
    await navigator.clipboard.writeText(url);
    button.textContent = "Link copied";
  } catch {
    button.textContent = url;
  }
});
