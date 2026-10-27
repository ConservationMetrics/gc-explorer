import importlib.util
import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("resolver", "scripts/resolve-filebrowser-share.py")
resolver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(resolver)


class ResolverTest(unittest.TestCase):
    def test_owner_scope_is_included_in_candidate(self):
        responses = iter([
            b"token",
            json.dumps([{"hash": "abc", "path": "/media", "userID": 7}]).encode(),
            json.dumps({"scope": "/projects/a"}).encode(),
        ])
        output = io.StringIO()
        with patch.object(sys, "argv", ["resolver", "https://files.cmistaging.guardianconnector.net/share/abc", "--username", "admin"]), patch.object(resolver.getpass, "getpass", return_value="secret"), patch.object(resolver, "request", side_effect=lambda *a, **k: next(responses)), redirect_stdout(output):
            resolver.main()
        self.assertIn("datalake/projects/a/media", output.getvalue())
        self.assertNotIn("secret", output.getvalue())

    def test_rejects_traversal_and_other_origin(self):
        with self.assertRaises(ValueError):
            resolver.relative_path("/foo/../bar", "path")
        with patch.object(sys, "argv", ["resolver", "https://other.example/share/abc", "--username", "admin"]), self.assertRaises(SystemExit):
            resolver.main()

    def test_missing_scope_fails_closed(self):
        responses = iter([b"token", b'[{"hash":"abc","path":"/media","userID":7}]', b'{}'])
        with patch.object(sys, "argv", ["resolver", "https://files.cmistaging.guardianconnector.net/share/abc", "--username", "admin"]), patch.object(resolver.getpass, "getpass", return_value="secret"), patch.object(resolver, "request", side_effect=lambda *a, **k: next(responses)), self.assertRaisesRegex(ValueError, "scope unavailable"):
            resolver.main()


if __name__ == "__main__":
    unittest.main()
