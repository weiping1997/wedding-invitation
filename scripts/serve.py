#!/usr/bin/env python3
"""本地预览用的小型静态伺服器：python3 scripts/serve.py [port]"""
import functools, http.server, os, socketserver, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("serving %s at http://127.0.0.1:%d" % (ROOT, PORT), flush=True)
    httpd.serve_forever()
