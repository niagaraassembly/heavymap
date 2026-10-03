"""`hm` command line. Contract: docs/for-agents/COMMANDS.md.

Exit codes: 0 ok · 1 findings (validation/guard errors, refused or stale decisions, refused identifier)
            · 2 usage or configuration error.
``--json`` prints one JSON object: {"command", "ok", "exit_code", "data", "findings"}.
"""

import argparse
import json
import sys
from pathlib import Path

from . import __version__, apply as apply_mod, guard as guard_mod, ids, status as status_mod, validate as validate_mod
from .findings import errors
from .schema import Schema, SchemaError, find_root

EXIT_OK, EXIT_FINDINGS, EXIT_USAGE = 0, 1, 2


def _emit(args, command, exit_code, data=None, findings=(), text=""):
    if args.json:
        print(json.dumps({"command": command, "ok": exit_code == EXIT_OK, "exit_code": exit_code,
                          "data": data if data is not None else {}, "findings": [f.as_dict() for f in findings]}, indent=2, sort_keys=True))
    else:
        if text:
            print(text)
        for f in findings:
            print(f)
    return exit_code


def _schema(args):
    return Schema(Path(args.root).resolve() if args.root else find_root())


def cmd_validate(args):
    s = _schema(args)
    findings = validate_mod.validate(s)
    errs = errors(findings)
    text = f"validate: {len(errs)} error(s), {len(findings) - len(errs)} warning(s) across {len(s.tables)} tables"
    return _emit(args, "validate", EXIT_FINDINGS if errs else EXIT_OK, {"errors": len(errs), "warnings": len(findings) - len(errs), "tables": len(s.tables)}, findings, text)


def cmd_guard(args):
    s = _schema(args)
    findings = guard_mod.guard(s, use_git=not args.no_git)
    errs = errors(findings)
    return _emit(args, "guard", EXIT_FINDINGS if errs else EXIT_OK, {"errors": len(errs), "g6_open": guard_mod.gate_open(s, "G6")}, findings,
                 f"guard: {len(errs)} violation(s); G6 {'OPEN' if guard_mod.gate_open(s, 'G6') else 'closed'}")


def cmd_apply(args):
    s = _schema(args)
    write = args.write and not args.dry_run
    result = apply_mod.apply(s, write=write)
    bad = [i for i in result["items"] if i["status"] in ("stale", "refused", "invalid")]
    aborted = result.get("aborted")
    code = EXIT_FINDINGS if (bad or aborted) else EXIT_OK
    lines = [f"apply ({'WRITE' if write else 'dry-run; nothing changed, pass --write to apply'}): " + (", ".join(f"{k}={v}" for k, v in sorted(result["summary"].items())) or "no decisions")]
    for it in result["items"]:
        if it["status"] in ("pending", "stale", "refused", "invalid"):
            lines.append(f"  {it['status']:8} {it['table']}.{it['record_id']}.{it['field']}: {it['old_value']!r} -> {it['new_value']!r} {it['reason']}".rstrip())
    if aborted:
        lines.append("aborted: " + aborted)
    if result["manifest"]:
        lines.append(f"applied {result['applied']} change(s); manifest {result['manifest']}")
    data = {k: result[k] for k in ("write", "summary", "applied", "manifest")}
    data["items"] = result["items"]
    if aborted:
        data["aborted"] = aborted
        data["validation_errors"] = result["validation_errors"]
    return _emit(args, "apply", code, data, (), "\n".join(lines))


def cmd_status(args):
    s = _schema(args)
    data = status_mod.collect(s)
    lines = ["tables: " + ", ".join(f"{k}={v}" for k, v in data["tables"].items()),
             "lifecycle: " + (", ".join(f"{k}={v}" for k, v in data["lifecycle"].items() if v) or "(no layers)"),
             "decisions: " + (", ".join(f"{k}={v}" for k, v in sorted(data["decisions"].items())) or "none"),
             f"candidates awaiting review: {data['candidates_new']}",
             "gate G6: " + ("OPEN" if data["g6_open"] else "CLOSED (nothing may be surfaced or published)")]
    return _emit(args, "status", EXIT_OK, data, (), "\n".join(lines))


def cmd_ids(args):
    try:
        if args.what == "check":
            fn = {"sbl20": ids.validate_sbl20, "swis6": ids.validate_swis6, "swis_sbl_id": ids.validate_swis_sbl_id}[args.kind]
            value = fn(args.value)
            return _emit(args, "ids", EXIT_OK, {"kind": args.kind, "value": value, "valid": True}, (), f"ok {args.kind} {value}")
        if args.what == "print-key":
            value = ids.render_print_key(args.value, args.style, swis6=args.swis)
        elif args.what == "compose":
            value = ids.compose_swis_sbl(args.swis, args.value)
        elif args.what == "cand":
            value = ids.cand_id(args.value)
        elif args.what == "service":
            value = ids.service_id(args.value, args.name)
        elif args.what == "layer":
            value = ids.layer_id(args.value, args.name)
        elif args.what == "decision":
            value = ids.decision_id()
        else:  # pragma: no cover
            raise AssertionError(args.what)
        return _emit(args, "ids", EXIT_OK, {"value": value}, (), value)
    except ids.IdentifierRefusal as exc:
        return _emit(args, "ids", EXIT_FINDINGS, {"valid": False, "refusal": exc.code}, (), f"refused: {exc.code}")
    except ValueError as exc:
        return _emit(args, "ids", EXIT_USAGE, {"error": str(exc)}, (), f"error: {exc}")


def cmd_review(args):
    from .review import serve

    s = _schema(args)
    serve(s.root, args.host, args.port)
    return EXIT_OK


def cmd_demo(args):
    from . import demo

    dest = Path(args.dest).resolve()
    if dest.exists() and any(dest.iterdir()):
        return _emit(args, "demo", EXIT_USAGE, {"error": "destination is not empty"}, (), f"error: {dest} is not empty")
    src = find_root(args.root) if args.root else find_root()
    demo.build(src, dest)
    return _emit(args, "demo", EXIT_OK, {"path": str(dest)}, (), f"synthetic sandbox created at {dest}\ntry: hm --root {dest} review")


def build_parser():
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--root", help="repository root (default: found from the current directory)")
    common.add_argument("--json", action="store_true", help="machine-readable output")
    p = argparse.ArgumentParser(prog="hm", description="HeavyMap registry tools. Docs: docs/for-agents/COMMANDS.md", epilog="exit codes: 0 ok, 1 findings, 2 usage/config")
    p.add_argument("--version", action="version", version=f"hm {__version__}")
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("validate", parents=[common], help="check headers, hygiene, enums, keys, foreign keys, decisions").set_defaults(fn=cmd_validate)
    g = sub.add_parser("guard", parents=[common], help="enforce hard rules (local-data, owner values, G6, deny list)")
    g.add_argument("--no-git", action="store_true", help="skip git tracked-file checks")
    g.set_defaults(fn=cmd_guard)
    a = sub.add_parser("apply", parents=[common], help="apply review_decisions to the registry (dry-run unless --write)")
    a.add_argument("--write", action="store_true", help="actually change the registry and write a manifest")
    a.add_argument("--dry-run", action="store_true", help="explicit dry-run (the default)")
    a.set_defaults(fn=cmd_apply)
    sub.add_parser("status", parents=[common], help="counts, lifecycle, decision states, gates").set_defaults(fn=cmd_status)
    i = sub.add_parser("ids", parents=[common], help="identifier helpers (ny_identifiers and ID allocators)")
    isub = i.add_subparsers(dest="what", required=True)
    c = isub.add_parser("check", parents=[common]); c.add_argument("kind", choices=["sbl20", "swis6", "swis_sbl_id"]); c.add_argument("value")
    pk = isub.add_parser("print-key", parents=[common]); pk.add_argument("value"); pk.add_argument("--style", required=True, choices=["padded", "unpadded", "erie", "genesee", "chautauqua"]); pk.add_argument("--swis")
    cp = isub.add_parser("compose", parents=[common]); cp.add_argument("swis"); cp.add_argument("value", metavar="sbl20")
    ca = isub.add_parser("cand", parents=[common]); ca.add_argument("value", metavar="endpoint")
    sv = isub.add_parser("service", parents=[common]); sv.add_argument("value", metavar="jurisdiction"); sv.add_argument("name", metavar="host_or_name")
    ly = isub.add_parser("layer", parents=[common]); ly.add_argument("value", metavar="service_id"); ly.add_argument("name", metavar="layer_path")
    isub.add_parser("decision", parents=[common])
    i.set_defaults(fn=cmd_ids)
    r = sub.add_parser("review", parents=[common], help="localhost review UI (127.0.0.1 only)")
    r.add_argument("--host", default="127.0.0.1", choices=["127.0.0.1", "localhost"])
    r.add_argument("--port", type=int, default=8765)
    r.set_defaults(fn=cmd_review)
    d = sub.add_parser("demo", parents=[common], help="create a sandbox repo root with SYNTHETIC rows to try the UI")
    d.add_argument("dest")
    d.set_defaults(fn=cmd_demo)
    return p


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        return args.fn(args)
    except SchemaError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return EXIT_USAGE
