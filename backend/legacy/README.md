Legacy one-off scripts moved here on 2026-03-04.

These scripts directly read or modify Firestore and are not part of normal app runtime.
Keep them out of the main `backend/` path to reduce accidental execution during routine work.

Before running any script here:
- Verify it targets the intended Firebase project.
- Check whether it writes or deletes data.
- Prefer making a backup or testing against a separate project first.
