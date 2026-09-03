# Local media storage (dev / MVP)

Uploaded thumbnails land in `images/`. Uploaded videos land in `videos/`.

These folders are gitignored (except `.gitkeep`). Files are served at `/uploads/...`.

## Production note

This local-disk approach is fine for demos. In production, swap `UploadService`
to AWS S3 (or GCS / Azure Blob) and prefer **presigned URLs** so browsers upload
large videos directly to object storage instead of through the Nest API.
