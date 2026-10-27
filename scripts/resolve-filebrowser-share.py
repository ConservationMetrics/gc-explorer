#!/usr/bin/env python3
"""Resolve a Filebrowser v2 share to a candidate SMB-relative path (read-only)."""

import argparse
import getpass
import hashlib
import json
import os
import posixpath
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


def relative_path(value, label):
    if not isinstance(value, str) or "\\" in value or "\x00" in value:
        raise ValueError(f"Invalid {label}")
    parts = value.strip("/").split("/")
    if any(part in (".", "..") for part in parts):
        raise ValueError(f"Invalid {label}: dot segments are not allowed")
    return "/".join(part for part in parts if part)


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


opener = build_opener(NoRedirect())


def request(url, token=None, data=None):
    headers = {"Accept": "application/json"}
    if token:
        headers["X-Auth"] = token
    if data is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(data).encode()
    with opener.open(Request(url, data=data, headers=headers), timeout=30) as response:
        return response.read()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("share_url", help="Full Filebrowser /share/HASH or /api/public/dl/HASH URL")
    parser.add_argument("--username", required=True)
    parser.add_argument("--files-origin", default="https://files.cmistaging.guardianconnector.net", help="Trusted Filebrowser origin")
    parser.add_argument("--storage-prefix", default="datalake", help="Filebrowser root relative to SMB share (default: datalake)")
    parser.add_argument("--mount", help="Local mount of SMB share, for file verification")
    parser.add_argument("--sample", help="Known attachment filename relative to shared folder, for verification")
    args = parser.parse_args()
    if bool(args.mount) != bool(args.sample):
        parser.error("--mount and --sample must be supplied together")
    origin = urlsplit(args.files_origin)
    if origin.scheme != "https" or not origin.hostname or origin.username or origin.password or origin.path not in ("", "/") or origin.query or origin.fragment:
        parser.error("--files-origin must be a trusted HTTPS origin without a path")
    parsed = urlsplit(args.share_url)
    if parsed.scheme != origin.scheme or parsed.netloc.lower() != origin.netloc.lower() or parsed.username or parsed.password or parsed.query or parsed.fragment:
        parser.error("Share URL must use the trusted origin and have no query or fragment")
    parts = parsed.path.strip("/").split("/")
    if len(parts) == 2 and parts[0] == "share":
        share_hash = parts[1]
    elif len(parts) == 4 and parts[:3] == ["api", "public", "dl"]:
        share_hash = parts[3]
    else:
        parser.error("Expected /share/HASH or /api/public/dl/HASH")
    if not share_hash or any(c not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-" for c in share_hash):
        parser.error("Invalid share hash")
    base = f"{origin.scheme}://{origin.netloc}"
    password = getpass.getpass("Filebrowser password: ")
    token = request(base + "/api/login", data={"username": args.username, "password": password}).decode().strip()
    del password
    shares = json.loads(request(base + "/api/shares", token=token))
    matches = [share for share in shares if share.get("hash") == share_hash]
    if len(matches) != 1:
        raise ValueError("Share not found uniquely; check the host, hash, and account permissions")
    share = matches[0]
    owner_id = share.get("userID")
    if not isinstance(owner_id, int) or isinstance(owner_id, bool) or owner_id < 1:
        raise ValueError("Share has no valid owner ID")
    owner = json.loads(request(f"{base}/api/users/{owner_id}", token=token))
    scope = owner.get("scope")
    if not isinstance(scope, str) or not scope:
        raise ValueError("Owner scope unavailable; use an administrator account")
    path = relative_path(share.get("path"), "share path")
    root = relative_path(args.storage_prefix, "storage prefix")
    scope = relative_path(scope, "owner scope")
    result = posixpath.join(*[p for p in (root, scope, path) if p]) if any((root, scope, path)) else "."
    print(f"Share owner ID: {owner_id}")
    print(f"Owner scope: /{scope}")
    print(f"Share path within owner scope: /{path}")
    print(f"Candidate SMB share-relative directory: {result}")
    print("Candidate only: confirm the deployment root, mount, and symlinks.")
    if args.sample:
        sample = relative_path(args.sample, "sample filename")
        if not sample:
            raise ValueError("Sample filename must not be empty")
        mount = Path(args.mount).resolve(strict=True)
        local = (mount / result / sample).resolve(strict=True)
        if not local.is_relative_to(mount) or not local.is_file():
            raise ValueError("Sample must be a file inside the mounted share")
        # Stream both files: media can be large. Do not print the public URL or token.
        def digest(stream):
            h = hashlib.sha256()
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                h.update(chunk)
            return h.hexdigest()
        url = base + "/api/public/dl/" + share_hash + "/" + quote(sample, safe="/")
        with local.open("rb") as f, opener.open(url, timeout=30) as response:
            if digest(f) != digest(response):
                raise ValueError("Sample content differs between SMB and Filebrowser")
        print("Verified: sample content matches the Filebrowser public download (SHA-256).")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, HTTPError, URLError, OSError, json.JSONDecodeError) as error:
        print(f"Resolution failed: {error}", file=sys.stderr)
        sys.exit(1)
