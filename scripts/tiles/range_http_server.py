#!/usr/bin/env python3
"""Minimal static file server with HTTP Range (single range) support, for local PMTiles tests only.
Usage: range_http_server.py <dir> <port>. Binds 127.0.0.1. Not deploy tooling."""
import http.server, os, re, sys
class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        r = self.headers.get('Range'); p = self.translate_path(self.path)
        if not r or not os.path.isfile(p): return super().send_head()
        m = re.match(r'bytes=(\d*)-(\d*)$', r.strip()); size = os.path.getsize(p)
        if not m: self.send_error(416); return None
        a, b = m.groups()
        if a == '': a, b = max(0, size - int(b)), size - 1
        else: a, b = int(a), min(int(b) if b else size - 1, size - 1)
        if a > b or a >= size:
            self.send_response(416); self.send_header('Content-Range', f'bytes */{size}'); self.end_headers(); return None
        f = open(p, 'rb'); f.seek(a); self.send_response(206)
        self.send_header('Content-Type', self.guess_type(p)); self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {a}-{b}/{size}'); self.send_header('Content-Length', str(b - a + 1)); self.end_headers()
        self.wfile.write(f.read(b - a + 1)); f.close(); return None
    def end_headers(self): self.send_header('Access-Control-Allow-Origin', '*'); super().end_headers()
os.chdir(sys.argv[1]); http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[2])), H).serve_forever()
