# Filebrowser share resolution API proof of concept

This opt-in, admin-only endpoint resolves a Filebrowser v2 share URL to a **candidate SMB share-relative path**. It signs in to Filebrowser, looks up the share and its owner's scope, then combines those paths with a configured storage prefix. It does not modify a view, access SMB, or serve attachments.

## Run locally against cmistaging

1. Set up Explorer locally following the [README](../README.md), including its database. To call the endpoint, sign in as an Explorer admin. The local `none` auth strategy provides a local admin session; bind the dev server to localhost only when using it.
2. In your local, uncommitted `.env`, add the following. Obtain a Filebrowser account with admin, share and download permissions; do not share its password in chat or commit it. Keep these credentials in private server configuration only.

   ```dotenv
   NUXT_FILEBROWSER_RESOLUTION_ENABLED=true
   NUXT_FILEBROWSER_RESOLUTION_ORIGIN=https://files.cmistaging.guardianconnector.net
   NUXT_FILEBROWSER_RESOLUTION_USERNAME=admin
   NUXT_FILEBROWSER_RESOLUTION_PASSWORD=your-filebrowser-password
   NUXT_FILEBROWSER_RESOLUTION_STORAGE_PREFIX=datalake
   ```

3. Start `pnpm dev`, open the local Explorer in a browser, and sign in as an admin. In that browser's developer console, use a share URL copied from a view configuration:

   ```js
   const response = await fetch('/api/admin/resolve-filebrowser-share', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ shareUrl: 'https://files.cmistaging.guardianconnector.net/api/public/dl/HASH' }),
   });
   console.log(response.status, await response.json());
   ```

The result contains the owner ID, scope, path within that scope, and `smbPath`; `verified` is always false. The URL must use the configured origin, and redirects are rejected. Filebrowser must support its v2 username/password login API; other auth methods may require changes. A non-admin Filebrowser account cannot necessarily list shares owned by others or read their scopes.

## Verify the mapping

The deployment template maps Filebrowser `/srv/datalake` to host `/mnt/persistent-storage/datalake` and mounts the SMB share at `/mnt/persistent-storage`. Check cmistaging's actual Filebrowser root, volume mappings, owner scope, and mount source before relying on the default prefix. `smbPath` is relative to the SMB share root, not a UNC address. Verify a known attachment against the Filebrowser download, including its contents, and check for symlinks. A missing share, generic media URL, unknown root, or inaccessible owner needs manual investigation.

This endpoint exposes storage paths to Explorer admins and uses Filebrowser credentials with broad access. Keep it disabled outside this controlled proof of concept. Explorer currently expects HTTP media URLs; writing an SMB path into a view will break media until an authorized media endpoint exists. Such an endpoint must restrict access to the intended view and directory and handle traversal and symlinks safely.
