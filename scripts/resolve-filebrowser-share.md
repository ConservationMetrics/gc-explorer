# Filebrowser share resolution proof of concept

This read-only helper resolves one existing Filebrowser v2 share URL to a **candidate SMB share-relative directory**. It does not modify Explorer configuration or serve media. It calls Filebrowser's login, shares, and owner APIs; the owner scope is required because the share path is relative to that scope. It never writes the password, token, or share-list response to disk. Use an admin account with share and download permissions to find shares belonging to other users and read their scopes.

## Cmistaging

1. Obtain a full media base URL from the target view's configuration, such as `https://files.cmistaging.guardianconnector.net/api/public/dl/HASH`. If you have database access, the following read-only query lists media fields from the current Explorer config schema. The schema on staging may differ by deployed version; do not paste the output into public logs, as the URLs grant access to shared data.

   ```sql
   SELECT view_id, view_name, view_type, primary_dataset,
          view_config::jsonb ->> 'MEDIA_BASE_PATH' AS media,
          view_config::jsonb ->> 'MEDIA_BASE_PATH_ALERTS' AS alerts,
          view_config::jsonb ->> 'MEDIA_BASE_PATH_ICONS' AS icons
   FROM views
   ORDER BY view_id;
   ```

2. From a machine that can reach Filebrowser, run Python 3.9 or later from this checkout. The password is prompted interactively; do not send it to an assistant or put it in shell history.

   ```sh
   python3 scripts/resolve-filebrowser-share.py \
     'https://files.cmistaging.guardianconnector.net/api/public/dl/HASH' \
     --username admin
   ```

   Replace the URL and username. The default Filebrowser origin is specifically cmistaging; `--files-origin` must be explicitly supplied for another host. The helper does not follow redirects, so an authentication gateway or alternate Filebrowser authentication method may require a different approach.

3. Check the actual Filebrowser container's `FB_ROOT`, its volume mapping, and the host's mount source. The deployment template maps `/srv/datalake` to `/mnt/persistent-storage/datalake` and mounts the SMB share at `/mnt/persistent-storage`, so the default `--storage-prefix datalake` is appropriate only if cmistaging uses that configuration. The result is relative to the SMB **share root**, not a UNC address; combine it with the actual SMB server and share name after checking the mount. Override `--storage-prefix` if needed.

4. On a trusted machine with the same SMB share mounted, compare a known attachment from the view to the public download:

   ```sh
   python3 scripts/resolve-filebrowser-share.py \
     'https://files.cmistaging.guardianconnector.net/api/public/dl/HASH' \
     --username admin --mount /mnt/persistent-storage --sample 'photo.jpg'
   ```

   The sample is relative to the shared directory. The helper compares SHA-256 digests of the local file and Filebrowser download. A matching sample verifies that file, not every file or the absence of symlinks elsewhere. Password-protected, expired, or inaccessible public shares cannot be verified with this download check; investigate separately. Do not assume a mapping is correct just because a directory exists.

If the share is missing, the owner cannot be read, the URL uses a generic media provider, or the storage root is unknown, resolve it manually. If the shared folder contains symlinks, establish how Filebrowser and the future Explorer service resolve them before migrating. Explorer currently expects HTTP media URLs; replacing them with SMB paths in the database will break media until an authorized Explorer media endpoint is implemented. Restrict that endpoint to the intended view and storage directory, and validate paths and symlinks.
