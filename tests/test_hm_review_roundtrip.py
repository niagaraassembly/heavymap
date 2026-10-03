"""UI save -> review_decisions row -> `hm apply` -> registry change, over a real localhost HTTP server."""

import csv
import http.client
import threading
import unittest
from urllib.parse import parse_qs, urlencode, urlsplit

import hm_testlib as lib
from heavymap import apply as apply_mod
from heavymap import csvio, guard
from heavymap.review import make_server

LAYER = "lyr-syn-example-parcels-0"
QUIRK = "Q-syn-parcels-01"
JT = "JT-syn-parcels-sbl-identifier-20261001"


class ReviewRoundTrip(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema, cls.tmp = lib.sandbox()
        cls.server = make_server(cls.schema.root, "127.0.0.1", 0)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        lib.cleanup(cls.tmp)

    def req(self, method, path, form=None, host=None, headers=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        hdrs = {"Host": host or f"127.0.0.1:{self.port}", **(headers or {})}
        body = None
        if form is not None:
            body = urlencode(form)
            hdrs["Content-Type"] = "application/x-www-form-urlencoded"
        conn.request(method, path, body=body, headers=hdrs)
        r = conn.getresponse()
        data = r.read().decode("utf-8")
        out = (r.status, dict(r.getheaders()), data)
        conn.close()
        return out

    def decisions(self):
        with open(self.schema.path("review_decisions"), newline="", encoding="utf-8") as fh:
            return list(csv.DictReader(fh))

    def save(self, **kw):
        form = {"table": "quirks", "record_id": QUIRK, "field": "status", "code_select": "E", "reviewer": "Dana",
                "linear_id": "NIA-999", "note": "", "return": "/quirks", "new_value": ""}
        form.update(kw)
        status, headers, _ = self.req("POST", "/save", form)
        self.assertEqual(status, 303)
        return parse_qs(urlsplit(headers["Location"]).query)

    def test_screens_render_and_hide_owner_values(self):
        lib.set_cell(self.schema, "claims", "CLM-syn-parcels-recordcount", "value_summary", "OWNERNME1=SMITH JOHN, ok")
        for path in ("/status", "/inbox", "/layers", f"/layer?id={LAYER}", "/quirks", "/joins", "/scores", "/decisions"):
            status, headers, body = self.req("GET", path)
            self.assertEqual(status, 200, path)
            self.assertNotIn("SMITH", body)
            self.assertIn("Content-Security-Policy", headers)
        status, _, body = self.req("GET", f"/layer?id={LAYER}")
        self.assertIn("OWNERNME1", body)           # the field NAME is shown ...
        self.assertIn("names only", body)          # ... flagged as a name
        self.assertIn("Gate G6 is CLOSED", self.req("GET", "/status")[2])
        lib.set_cell(self.schema, "claims", "CLM-syn-parcels-recordcount", "value_summary", "server returnCountOnly 1200")

    def test_round_trip_ui_save_apply_registry_change(self):
        # 1. UI save of a corrected value (decision E) appends exactly one field-level row
        n0 = len(self.decisions())
        q = self.save(table="quirks", record_id=QUIRK, field="handling", new_value="read as text | log float inputs", note="reviewed on Deb; keep leading zeros")
        self.assertIn("ok", q, q)
        rows = self.decisions()
        self.assertEqual(len(rows), n0 + 1)
        row = rows[-1]
        self.assertEqual({k: row[k] for k in ("record_id", "table", "field", "old_value", "new_value", "decision_code", "reviewer", "linear_id")}, {
            "record_id": QUIRK, "table": "quirks", "field": "handling", "old_value": "read as text | refuse float input",
            "new_value": "read as text | log float inputs", "decision_code": "E", "reviewer": "Dana", "linear_id": "NIA-999"})
        self.assertRegex(row["decision_id"], r"^DEC-[0-9A-HJKMNP-TV-Z]{26}$")
        self.assertRegex(row["timestamp"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
        self.assertEqual(row["note"], "reviewed on Deb; keep leading zeros".replace(";", ","))
        # registry is untouched until apply
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "handling"), "read as text | refuse float input")
        self.assertIn("pending", self.req("GET", "/quirks")[2])
        # 2. dry-run shows it, 3. --write applies the CORRECTED value
        dry = apply_mod.apply(self.schema, write=False)
        self.assertEqual(dry["summary"].get("pending"), 1)
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "handling"), "read as text | refuse float input")
        done = apply_mod.apply(self.schema, write=True)
        self.assertEqual(done["applied"], 1)
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "handling"), "read as text | log float inputs")
        self.assertIn("applied", self.req("GET", "/quirks")[2])
        # 4. enum field via select, confirm button, flag code
        self.save(table="join_tests", record_id=JT, field="grade", new_value="B")
        self.save(table="quirks", record_id=QUIRK, field="status", code_select="D", note="not sure this is blocking")
        self.save(table="use_decisions", record_id=LAYER, field="licence_status", new_value="", code="A")
        apply_mod.apply(self.schema, write=True)
        self.assertEqual(lib.get_cell(self.schema, "join_tests", JT, "grade"), "B")
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "status"), "open")  # D never changes the value
        self.assertEqual(lib.get_cell(self.schema, "use_decisions", LAYER, "licence_status"), "unknown")
        from heavymap import validate
        from heavymap.findings import errors
        self.assertEqual(errors(validate.validate(self.schema)), [])
        self.assertEqual(errors(guard.guard(self.schema, use_git=False)), [])

    def test_refusals_leave_no_row(self):
        n0 = len(self.decisions())
        cases = [
            dict(linear_id=""),                                               # Linear id required
            dict(linear_id="ABC-1"),
            dict(reviewer="Codex"),                                           # agents cannot decide
            dict(field="count", new_value="9"),                               # not in editable whitelist
            dict(field="status", new_value="bogus"),                          # not a controlled value
            dict(table="layers", record_id=LAYER, field="lifecycle_status", new_value="surfaced", reviewer="Morgen"),  # G6 closed
            dict(table="layers", record_id=LAYER, field="lifecycle_status", new_value="dormant", reviewer="Dana"),     # Morgen only
            dict(table="use_decisions", record_id="lyr-syn-mpac-roll-0", field="use_decision", new_value="use"),  # n/a row -> unknown record
            dict(field="status", code_select="F", note=""),                   # flag needs a note
            dict(field="handling", new_value="a;b"),                          # hygiene
            dict(field="status", new_value="open"),                           # edit must change the value
            dict(field="handling", new_value="OWNERNME1=SMITH"),              # owner values never enter decisions
            dict(field="handling", new_value="fine", note="OWNERNME1: SMITH"),
        ]
        for case in cases:
            q = self.save(**case)
            self.assertIn("err", q, case)
        self.assertEqual(len(self.decisions()), n0)

    def test_local_only_and_request_checks(self):
        with self.assertRaises(ValueError):
            make_server(self.schema.root, "0.0.0.0", 0)
        self.assertEqual(self.server.server_address[0], "127.0.0.1")
        self.assertEqual(self.req("GET", "/status", host="evil.example:80")[0], 403)
        status, _, _ = self.req("POST", "/save", {"table": "quirks"}, headers={"Origin": "http://evil.example"})
        self.assertEqual(status, 403)
        self.assertEqual(self.req("GET", "/nope")[0], 404)
        self.assertEqual(self.req("POST", "/save", {"x": "y" * 70000})[0], 413)
        self.assertEqual(self.req("GET", "/layer?id=..%2F..%2Fetc")[0], 200)  # unknown id just renders "Unknown layer"


if __name__ == "__main__":
    unittest.main()
