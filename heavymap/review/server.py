"""Localhost review UI (stdlib http.server, server-rendered HTML, no JavaScript, no external assets).

* Binds 127.0.0.1 (or localhost) only; checks Host and Origin; request bodies are capped.
* Reads only the CSV tables named in data/schema/table-schema.json. There is no code path to local-data/,
  so raw pulled rows (including any owner values) can never reach a page. Cells also pass through
  ``guard.scrub_owner`` before display.
* Every save appends ONE field-level row to data/reviewed/review_decisions.csv and changes nothing else;
  ``hm apply`` is what moves the registry.
"""

import html
import json
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, quote, urlsplit

from .. import apply as apply_mod
from .. import decisions, guard, score, status, validate
from ..findings import errors
from ..schema import Schema

MAX_BODY = 65536
ALLOWED_HOSTS = ("127.0.0.1", "localhost")

SCREENS = [
    ("status", "Status board"),
    ("inbox", "Inbox candidates"),
    ("layers", "Layers"),
    ("quirks", "Quirks"),
    ("joins", "Join tests"),
    ("scores", "Scores"),
    ("decisions", "Use decisions"),
]
SCREEN_TABLE = {"inbox": "candidates", "quirks": "quirks", "joins": "join_tests", "scores": "scores", "decisions": "use_decisions"}
HIDDEN_COLS = {"pii_owner_fields_names_only"}  # rendered specially (names only, masked badge)

CSS = """
body{font:14px/1.45 system-ui,sans-serif;margin:0;color:#1b1b1b;background:#f6f6f4}
header{background:#1d3b53;color:#fff;padding:.6rem 1rem}header a{color:#cfe3f3;margin-right:1rem;text-decoration:none}
header a.on{color:#fff;font-weight:700;border-bottom:2px solid #fff}
main{max-width:1100px;margin:1rem auto;padding:0 1rem}
.banner{padding:.6rem 1rem;border-radius:4px;margin:.5rem 0;font-weight:600}
.closed{background:#fde8e8;color:#8a1c1c}.open{background:#e6f4e6;color:#1d5e1d}
.flash{background:#e6f0fa;padding:.5rem 1rem;border-left:4px solid #1d3b53;margin:.5rem 0}
.err{background:#fde8e8;border-left-color:#8a1c1c}
section.card{background:#fff;border:1px solid #d5d5d0;border-radius:6px;padding:.7rem 1rem;margin:.8rem 0}
section.card h3{margin:.1rem 0 .3rem}
.stamp{font-size:12px;color:#555;background:#f0f0ec;padding:.2rem .5rem;border-radius:3px;margin-bottom:.4rem}
table{border-collapse:collapse;width:100%}td,th{padding:.2rem .5rem;border-bottom:1px solid #eee;text-align:left;vertical-align:top}
th{width:16%;color:#555;font-weight:600}
form.field{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:.25rem 0;padding:.3rem;background:#fafaf7;border:1px dashed #ccc}
form.field label{min-width:9rem;font-weight:600}input[type=text],select{padding:.15rem .3rem}
.badge{font-size:11px;padding:0 .4rem;border-radius:8px;background:#eee;margin-left:.3rem}
.pending{background:#fff3cd}.applied{background:#d4edda}.stale,.refused,.invalid{background:#f8d7da}.flag{background:#e2e3f5}
.lock{background:#f3e5f5;padding:0 .3rem;border-radius:3px}
.bar{display:inline-block;height:.7rem;background:#1d3b53;vertical-align:middle}
"""


def esc(value):
    return html.escape(str(value), quote=True)


class Response:
    def __init__(self, status=200, body="", headers=None, content_type="text/html; charset=utf-8"):
        self.status = status
        self.body = body.encode("utf-8") if isinstance(body, str) else body
        self.headers = [("Content-Type", content_type), ("Cache-Control", "no-store"),
                        ("X-Content-Type-Options", "nosniff"), ("Referrer-Policy", "no-referrer"),
                        ("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'")]
        self.headers += headers or []


class ReviewApp:
    """Request logic, independent of sockets so it can be tested directly."""

    def __init__(self, root, port=0):
        self.root = root
        self.port = port

    # -- helpers ----------------------------------------------------------------
    def schema(self):
        return Schema(self.root)  # reload on every request: CSVs change under us

    def host_ok(self, host_header):
        host = (host_header or "").rsplit(":", 1)[0] if ":" in (host_header or "") else (host_header or "")
        return host in ALLOWED_HOSTS

    def dispatch(self, method, target, headers, body=b""):
        if not self.host_ok(headers.get("Host", "")):
            return Response(403, "Forbidden host")
        parts = urlsplit(target)
        query = {k: v[0] for k, v in parse_qs(parts.query).items()}
        try:
            if method == "GET":
                return self.get(parts.path, query, headers)
            if method == "POST" and parts.path == "/save":
                origin = headers.get("Origin")
                if origin and not self.host_ok(urlsplit(origin).netloc):
                    return Response(403, "Forbidden origin")
                if len(body) > MAX_BODY:
                    return Response(413, "Body too large")
                form = {k: v[0] for k, v in parse_qs(body.decode("utf-8", "replace"), keep_blank_values=True).items()}
                return self.save(form, headers)
        except Exception as exc:  # never leak a traceback page
            return Response(500, page("Error", f'<div class="flash err">Internal error: {esc(type(exc).__name__)}: {esc(exc)}</div>', ""))
        return Response(404, page("Not found", "<p>Not found.</p>", ""))

    # -- POST -------------------------------------------------------------------
    def save(self, form, headers):
        schema = self.schema()
        cookies = SimpleCookie(headers.get("Cookie", ""))
        reviewer = form.get("reviewer") or (cookies["hm_reviewer"].value if "hm_reviewer" in cookies else "")
        linear = form.get("linear_id") or (cookies["hm_linear"].value if "hm_linear" in cookies else "")
        code = form.get("code") or form.get("code_select", "E")
        back = form.get("return", "/status")
        if not back.startswith("/") or back.startswith("//"):
            back = "/status"
        sep = "&" if "?" in back else "?"
        try:
            row = decisions.record_decision(
                schema, table=form.get("table", ""), record_id=form.get("record_id", ""), field=form.get("field", ""),
                new_value=form.get("new_value", ""), code=code, note=form.get("note", ""), reviewer=reviewer, linear_id=linear)
            loc = f"{back}{sep}ok={quote(row['decision_id'])}"
            extra = [("Set-Cookie", f"hm_reviewer={quote(reviewer)}; Path=/; SameSite=Strict"),
                     ("Set-Cookie", f"hm_linear={quote(linear.upper())}; Path=/; SameSite=Strict")]
        except decisions.DecisionError as exc:
            loc = f"{back}{sep}err={quote(str(exc))}"
            extra = []
        return Response(303, "", [("Location", loc)] + extra)

    # -- GET --------------------------------------------------------------------
    def get(self, path, q, headers):
        if path == "/":
            return Response(303, "", [("Location", "/status")])
        if path == "/health":
            return Response(200, json.dumps({"ok": True}), content_type="application/json")
        schema = self.schema()
        cookies = SimpleCookie(headers.get("Cookie", ""))
        ctx = Ctx(schema, q, cookies, path + (f"?id={quote(q.get('id', ''))}" if path == "/layer" else ""))
        if path == "/status":
            return Response(200, page("Status board", status_screen(ctx), "status", q))
        if path == "/layers":
            return Response(200, page("Layers", layers_list(ctx), "layers", q))
        if path == "/layer":
            return Response(200, page("Layer", layer_screen(ctx, q.get("id", "")), "layers", q))
        name = path.strip("/")
        if name in SCREEN_TABLE:
            title = dict(SCREENS)[name]
            return Response(200, page(title, table_screen(ctx, SCREEN_TABLE[name], name), name, q))
        return Response(404, page("Not found", "<p>Not found.</p>", ""))


class Ctx:
    def __init__(self, schema, q, cookies, path):
        self.schema = schema
        self.q = q
        self.path = path
        self.reviewer = cookies["hm_reviewer"].value if "hm_reviewer" in cookies else ""
        self.linear = cookies["hm_linear"].value if "hm_linear" in cookies else ""
        self.plan = {(i["table"], i["record_id"], i["field"]): i for i in apply_mod.plan(schema)}

    def cell(self, text):
        return esc(guard.scrub_owner(self.schema, text))


# -- rendering -------------------------------------------------------------------
def page(title, body, active, q=None):
    q = q or {}
    nav = "".join(f'<a href="/{n}" class="{"on" if n == active else ""}">{esc(label)}</a>' for n, label in SCREENS)
    flash = ""
    if q.get("ok"):
        flash = f'<div class="flash">Saved decision {esc(q["ok"])}. It is pending until <code>hm apply --write</code> runs.</div>'
    if q.get("err"):
        flash = f'<div class="flash err">Not saved: {esc(q["err"])}</div>'
    return (f"<!doctype html><html lang=en><meta charset=utf-8><title>{esc(title)} - hm review</title>"
            f"<style>{CSS}</style><header><strong>hm review</strong> &nbsp; {nav}</header><main>{flash}<h2>{esc(title)}</h2>{body}</main></html>")


def gate_banner(schema):
    if guard.gate_open(schema, "G6"):
        return '<div class="banner open">Gate G6 is OPEN.</div>'
    return '<div class="banner closed">Gate G6 is CLOSED: nothing may be surfaced or published. Agents cannot approve; every decision here needs a human reviewer and a Linear issue.</div>'


def stamp_strip(table, rec):
    bits = []
    for col in ("linear_id", "run_id", "access_date", "profile_date", "found_date", "test_date", "last_checked"):
        if rec.get(col):
            bits.append(f"{col}: {esc(rec[col])}")
    for col in ("evidence_urls", "source_url", "endpoint", "base_url"):
        if rec.get(col):
            links = [u.strip() for u in rec[col].split(" | ") if u.strip().startswith(("http://", "https://"))]
            if links:
                bits.append(f"{col}: " + " ".join(f'<a href="{esc(u)}" rel="noopener noreferrer" target="_blank">{esc(u)}</a>' for u in links))
    return f'<div class="stamp">{" &middot; ".join(bits) or "no provenance stamp on this row"}</div>' if bits else '<div class="stamp">no provenance stamp on this row</div>'


def field_form(ctx, table, rec, col):
    schema = ctx.schema
    t = schema.tables[table]
    rid = rec[t.key]
    cur = rec[col]
    item = ctx.plan.get((table, rid, col))
    badge = f' <span class="badge {esc(item["status"])}">{esc(item["code"])}:{esc(item["status"])}</span>' if item else ""
    enum = schema.enum_for(table, col)
    if enum is not None:
        opts = "".join(f'<option value="{esc(v)}"{" selected" if v == cur else ""}>{esc(v)}</option>' for v in [""] + enum)
        inp = f'<select name="new_value">{opts}</select>'
    else:
        inp = f'<input type="text" name="new_value" value="{ctx.cell(cur)}" size="34">'
    codes = "".join(f'<option value="{c}"{" selected" if c == "E" else ""}>{c} {esc(lbl)}</option>' for c, lbl in schema.decision_codes().items())
    return (f'<form class="field" method="post" action="/save">'
            f'<label>{esc(col)}{badge}</label>{inp}'
            f'<select name="code_select">{codes}</select>'
            f'<input type="text" name="note" placeholder="note" size="22">'
            f'<input type="text" name="reviewer" value="{esc(ctx.reviewer)}" placeholder="reviewer" size="8">'
            f'<input type="text" name="linear_id" value="{esc(ctx.linear)}" placeholder="NIA-xx" size="8">'
            f'<input type="hidden" name="table" value="{esc(table)}"><input type="hidden" name="record_id" value="{esc(rid)}">'
            f'<input type="hidden" name="field" value="{esc(col)}"><input type="hidden" name="return" value="{esc(ctx.path)}">'
            f'<button type="submit">Save</button><button type="submit" name="code" value="A" title="Confirm the current value as is">Confirm</button></form>')


def owner_names(rec):
    names = [n.strip() for n in rec.get("pii_owner_fields_names_only", "").split(" | ") if n.strip()]
    return names


def card(ctx, table, rec, title=None, extra=""):
    t = ctx.schema.tables[table]
    rid = rec[t.key]
    rows = []
    for col in t.columns:
        if col in t.editable or col in HIDDEN_COLS or rec[col] == "":
            continue
        rows.append(f"<tr><th>{esc(col)}</th><td>{ctx.cell(rec[col])}</td></tr>")
    if table == "layers":
        names = owner_names(rec)
        if names:
            rows.append('<tr><th>owner-bearing fields</th><td>' + " ".join(f'<span class="lock">&#128274; {esc(n)}</span>' for n in names) + ' <em>names only; values are never shown</em></td></tr>')
    forms = "".join(field_form(ctx, table, rec, col) for col in t.editable)
    return (f'<section class="card" id="{esc(rid)}"><h3>{esc(title or rid)}</h3>{stamp_strip(table, rec)}'
            f'<table>{"".join(rows)}</table>{extra}{forms}</section>')


def table_screen(ctx, table, name):
    recs = ctx.schema.load_rows(table)
    if not recs:
        return gate_banner(ctx.schema) + f"<p>No rows in <code>{esc(ctx.schema.tables[table].path)}</code> yet.</p>"
    out = [gate_banner(ctx.schema)]
    if name == "inbox":
        out.append("<p>Staging rows written by scans. Accepting a candidate records the decision only; creating the service/layer row is a later (planned) import step.</p>")
    status_filter = ctx.q.get("status")
    for rec in recs:
        if status_filter and rec.get("status") != status_filter:
            continue
        extra = score_bars(ctx, rec) if table == "scores" else ""
        out.append(card(ctx, table, rec, extra=extra))
    return "".join(out)


def score_bars(ctx, rec):
    f = ctx.schema.controlled["score_formula"]
    rows = []
    for comp, weight in f["weights"].items():
        v = rec.get(comp, "")
        width = (int(v) / f["max_component"] * 100) if v != "" else 0
        judged = " (judgement: editable below)" if comp in f["judgement_components"] else " (computed)"
        rows.append(f'<tr><th>{esc(comp)} w{weight}</th><td><span class="bar" style="width:{width:.0f}px"></span> {esc(v) if v != "" else "blank = unmeasured"}{judged}</td></tr>')
    computed = score.total(ctx.schema, rec)
    rows.append(f'<tr><th>total (formula {esc(rec["formula_version"])} - proposal)</th><td>stored: {esc(rec["total"] or "blank")} &middot; recomputed: {esc(computed or "blank")}. A score supports triage; it never approves anything.</td></tr>')
    return f"<table>{''.join(rows)}</table>"


def layers_list(ctx):
    layers = ctx.schema.load_rows("layers")
    if not layers:
        return gate_banner(ctx.schema) + "<p>No layers in the registry yet.</p>"
    rows = "".join(
        f'<tr><td><a href="/layer?id={quote(l["layer_id"])}">{esc(l["layer_id"])}</a></td><td>{ctx.cell(l["layer_name"])}</td>'
        f'<td>{esc(l["lifecycle_status"])}</td><td>{esc(l["grain"])}</td><td>{esc(l["linear_id"])}</td></tr>' for l in layers)
    return gate_banner(ctx.schema) + f"<table><tr><th>layer_id</th><th>name</th><th>lifecycle</th><th>grain</th><th>Linear</th></tr>{rows}</table>"


def layer_screen(ctx, layer_id):
    s = ctx.schema
    layer = next((l for l in s.load_rows("layers") if l["layer_id"] == layer_id), None)
    if layer is None:
        return gate_banner(s) + "<p>Unknown layer.</p>"
    out = [gate_banner(s), card(ctx, "layers", layer, title=f"Layer {layer_id}")]
    fields = [f for f in s.load_rows("fields") if f["layer_id"] == layer_id]
    if fields:
        items = "".join(f'<li>{esc(f["field_name"])} <span class="badge">{esc(f["role"] or "?")}</span>'
                        + (' <span class="lock">&#128274; owner-bearing, name only</span>' if f["owner_flag"] == "yes" else "") + "</li>" for f in fields)
        out.append(f'<section class="card"><h3>Field register (names only)</h3><ul>{items}</ul></section>')
    for table, label in (("identifier_rules", "Identifier rules"), ("quirks", "Quirks"), ("join_tests", "Join tests"),
                         ("scores", "Score"), ("use_decisions", "Use decision")):
        recs = [r for r in s.load_rows(table) if r["layer_id"] == layer_id]
        if recs:
            out.append(f"<h3>{esc(label)}</h3>")
            out += [card(ctx, table, r, extra=score_bars(ctx, r) if table == "scores" else "") for r in recs]
        else:
            out.append(f'<p><em>No {esc(label.lower())} rows for this layer yet.</em></p>')
    return "".join(out)


def status_screen(ctx):
    s = ctx.schema
    data = status.collect(s)
    findings = validate.validate(s) + guard.guard(s, use_git=False)
    errs = errors(findings)
    out = [gate_banner(s)]
    out.append("<section class=card><h3>Row counts</h3><table>" + "".join(f"<tr><th>{esc(k)}</th><td>{v}</td></tr>" for k, v in data["tables"].items()) + "</table></section>")
    out.append("<section class=card><h3>Lifecycle</h3><table>" + "".join(f"<tr><th>{esc(k)}</th><td>{v}</td></tr>" for k, v in data["lifecycle"].items()) + "</table></section>")
    dec = data["decisions"] or {}
    out.append("<section class=card><h3>Decisions (latest per field)</h3><table>" + ("".join(f'<tr><th>{esc(k)}</th><td>{v}</td></tr>' for k, v in dec.items()) or "<tr><td>none yet</td></tr>")
               + "</table><p>pending = saved here but not yet written to the registry by <code>hm apply --write</code>.</p></section>")
    if data["open_flags"]:
        out.append("<section class=card><h3>Open flags (D / F / H / X / N)</h3><ul>" + "".join(
            f'<li>{esc(f["code"])} {esc(f["table"])} {esc(f["record_id"])} .{esc(f["field"])} by {esc(f["reviewer"])}</li>' for f in data["open_flags"]) + "</ul></section>")
    out.append(f"<section class=card><h3>Checks</h3><p>{len(errs)} error(s), {len(findings) - len(errs)} warning(s) from validate + guard (without git checks).</p>"
               + "<ul>" + "".join(f"<li>{esc(f)}</li>" for f in findings[:20]) + "</ul></section>")
    return "".join(out)


# -- server ----------------------------------------------------------------------
def make_server(root, host="127.0.0.1", port=8765):
    if host not in ALLOWED_HOSTS:
        raise ValueError("review UI binds to 127.0.0.1 or localhost only")
    app = ReviewApp(root, port)

    class Handler(BaseHTTPRequestHandler):
        server_version = "hm-review"

        def _run(self, method):
            length = int(self.headers.get("Content-Length") or 0)
            body = self.rfile.read(min(length, MAX_BODY + 1)) if length else b""
            hdrs = {k: v for k, v in self.headers.items()}
            resp = app.dispatch(method, self.path, hdrs, body)
            self.send_response(resp.status)
            for k, v in resp.headers:
                self.send_header(k, v)
            self.send_header("Content-Length", str(len(resp.body)))
            self.end_headers()
            self.wfile.write(resp.body)

        def do_GET(self):
            self._run("GET")

        def do_POST(self):
            self._run("POST")

        def log_message(self, fmt, *args):
            pass

    server = ThreadingHTTPServer((host, port), Handler)
    app.port = server.server_address[1]
    return server


def serve(root, host="127.0.0.1", port=8765):
    server = make_server(root, host, port)
    print(f"hm review: http://{host}:{server.server_address[1]}/  (Ctrl+C to stop; local only, no auth)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
