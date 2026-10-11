# Suggested Domain Model and API Contracts

## Entities
- `User(id, email, display_name, guide_mode, created_at)`
- `Family/Workspace(id, owner_id, privacy_default)`; `Membership(user_id, workspace_id, role, guardian_id?)`
- `Project(id, workspace_id, title, status[draft|finished], bpm, time_signature, sample_rate, privacy, last_opened_at, updated_at, current_version)`
- `Session(id, project_id, started_at, ended_at, device, resumed_from?)`
- `Asset(id, owner_id, project_id, kind[dry|variant|preview|master|video|image|midi], storage_key, mime, duration, checksum, provenance, created_at)`
- `Layer(id, project_id, title, input_kind, original_asset_id, active_variant_id, order, gain_db, pan[-1..1], mute, solo, effects_json, deleted_at?)`
- `Clip(id, layer_id, asset_id, timeline_start, source_start, duration, loop_enabled, loop_length, gain, fades)`
- `Variant(id, layer_id, source_asset_id, result_asset_id, transform_type, params, model_version, status)`
- `Operation(id, project_id, session_id, seq, type, payload, inverse_payload, applied_at, undone_at?)`
- `MagicEvent(id, project_id, layer_id?, session_id, time_range, category, confidence, observation, rationale, suggested_action, status, before_asset_id?, preview_asset_id?, after_asset_id?, operation_id?)`
- `RenderJob(id, project_id, kind, status, progress, model, version, error, output_asset_id)`
- `ShareGrant(id, project_id, audience, can_download, can_remix, expires_at, revoked_at)`
- `PackageEntitlement(id, user_id, sku, credits, expires_at)` (future)

## Minimal endpoints (versioned)
```
POST   /v1/projects
GET    /v1/projects?status=draft
GET    /v1/projects/{id}
PATCH  /v1/projects/{id}
POST   /v1/projects/{id}/sessions
POST   /v1/projects/{id}/assets/upload-url
POST   /v1/projects/{id}/layers
PATCH  /v1/layers/{id}
POST   /v1/projects/{id}/operations
POST   /v1/projects/{id}/undo
POST   /v1/projects/{id}/redo
GET    /v1/projects/{id}/history
POST   /v1/layers/{id}/analyze
GET    /v1/projects/{id}/magic-events
POST   /v1/layers/{id}/preview-transform
POST   /v1/layers/{id}/preview-fix
POST   /v1/layers/{id}/apply-variant
POST   /v1/projects/{id}/render
GET    /v1/jobs/{id}
POST   /v1/projects/{id}/share-grants
DELETE /v1/share-grants/{id}
```
Use OpenAPI and generated TS clients; validate ownership on every asset and job. Job endpoints return IDs immediately and stream/poll progress. Every mutation uses an idempotency key where feasible. Use transactions for operations/history and object storage checksum validation.

## Example MagicEvent payload
```json
{
  "id":"magic_evt_001",
  "project_id":"project_123",
  "layer_id":"layer_1",
  "category":"possible_metronome_bleed",
  "time_range":{"start_s":8.0,"end_s":8.3},
  "confidence":0.78,
  "observation":"I heard a click near 8 seconds.",
  "rationale":"It aligns with the click track you enabled.",
  "suggested_action":"preview_click_suppression",
  "status":"suggested"
}
```
