# Certificate Layout Analysis (layout0–layout7)

There are two **independent renderers** for each layout, and they must be kept in sync manually — that's the single biggest structural risk in this system.

1. **Web preview** — `certs/cert_layout/layoutN.php`, included by `certs/certpage.php`. Positions elements with absolute-positioned HTML/CSS, recalculated in JS on load/resize as `mm-constant × (containerWidth / 297 or 210)`.
2. **PDF download** — `certs/generate_certificate.php`, using FPDI/FPDF. Positions are **hardcoded in a separate PHP if/elseif chain keyed on `$layout_path` string**, in raw mm — it does not read or share any code with the layout `.php` files above.

## Per-layout breakdown

| Layout | Orientation | Name position | Cert ID / QR position | Notes |
|---|---|---|---|---|
| **layout0** | Landscape (297×210) | top=80mm, left=15.5mm, hardcoded color `#202948` | cert-id bottom=42/left=63.2mm; class-date bottom=57mm; held-on bottom=36.8mm; QR bottom=25/left=15.5mm | **Legacy/dead layout.** Hardcoded bg `assets/images/blankcert.png` — ignores `$certbg_url`, `$name_font`, `$name_color`, `$certid_font/color` entirely. QR is an `<img>` from `api.qrserver.com` (external 3rd-party API call at render time), not the client-side `qr-code-styling` lib used everywhere else. Has `class-date`/`held-on` fields no other layout uses. |
| **layout1** | Landscape | top=80mm, left=15.5mm | cert-id bottom=21/right=258mm; QR bottom=24.6/left=15.8mm | First "templated" layout — dynamic bg/fonts/colors, `qr-code-styling` lib. Falls into PDF generator's `else` (generic landscape) branch. |
| **layout2** | Landscape | Centered (50% / 50%) | cert-id bottom=7.7% centered; QR bottom=9.9% centered | Default/fallback background asset is `assets/certbg/CTRA/blankcertCTRA003.png` and default missing-bg fallback across the app is literally `layout2.png`. |
| **layout3** | Landscape (`certificateLayoutOrientation='landscape'` explicitly set) | top=86mm, left=21mm | cert-id bottom=11mm, centered under QR; QR bottom=14.9/right=27.5mm, width 31mm | Only layout with a `qrSvg` viewBox override (`0 0 280 280`). |
| **layout4** | **Portrait** (210×297, scale base = 210mm not 297mm) | top=158mm(of 210 width basis), centered | cert-id bottom=20mm centered; QR bottom=25mm centered, width 41mm | Overlays start at `opacity:0` and fade in after JS positions them (avoids flash-of-unpositioned-content). **PDF generator forces `$orientation = 'L'` for ALL layouts (line 151)** — so layout4's downloaded PDF is landscape while its web preview is portrait. This is a real mismatch bug worth flagging. |
| **layout5** | Landscape | top=41% centered | cert-id bottom=11mm relative to QR; QR bottom=14.9/right=27.5mm | Only layout with an **`others-overlay`** field (`$others`, sourced from `certificates.others` DB column) positioned at top=56.5%. |
| **layout6** | Landscape | top=50% centered | Same as layout3/5 (bottom=11mm relative to QR; QR bottom=14.9/right=27.5mm) | Visually = layout3's QR/cert-id positioning + layout2's centered name. PDF generator groups it with layout5/7 for QR/cert-id math but has **no dedicated name-position branch** — falls into the generic `else` (80mm top-left) branch, so its PDF name position will NOT match its web-centered name position. |
| **layout7** | Landscape | top=45% centered | Same QR/cert-id group as layout5/6 | Like layout5 minus the `others` field. |

## Dependencies that determine "correct" placement

- **`templates.layout_path`** (DB, `schema.sql`) selects which `layoutN.php` to include — set at event creation/edit (`add_event.php`, `edit_event.php`, `duplicate_event.php`).
- **`get_certificate_background($organizer_cd, $event_code)`** (`config/functions.php`) — not a DB column at all, it's a filesystem probe of `storage/{organizer_cd}/{event_code}/cert.{png,jpg,jpeg,webp,gif}`, falling back to `assets/defaultcerts/layout2.png`.
- **`templates.name_font/name_color/certid_font/certid_color`** — per-event styling columns, injected into inline CSS in each layout file (all default to Arial/#ffffff if unset).
- **`organizers.tier` → `$watermark`** — tier gates whether `qr-code-styling` embeds the Certhora logo watermark in the QR center (tier 0/1 = watermark on per `$tierLimits` in `functions.php`).
- **A4 aspect-ratio assumption** — every layout hardcodes `aspect-ratio: 297/210` (or `210/297` for layout4) on `#cert-preview` and computes pixel offsets as `mm × (renderedWidth / 297)`. If the uploaded background image isn't actually A4-proportioned, every overlay silently mis-registers — there's no validation on upload (`add_event.php`/`edit_event.php` only check extension + 5MB size, not dimensions/aspect ratio).
- **External CDN scripts** (html2canvas 1.4.1, jsPDF 2.5.1, qr-code-styling 1.5.0) — loaded per-layout-include, meaning they're re-fetched/re-declared every time `certpage.php` includes a layout; no version pinning beyond the CDN URL itself.
- **`certs/cert_layout/preview.php`** — dev/admin tool that takes all these same variables via `$_GET` with defaults, letting someone iterate on a layout's CSS/JS without a real certificate row. `$layout` is sanitized with `preg_replace('/[^a-zA-Z0-9_]/','',...)` before being used in `include`, so it's not directly path-traversable, but it does allow including *any* `.php` file in that directory by name.

## Migration-relevant takeaways

- Nothing about layout is stored per-certificate — it's resolved at render time via `event_code → templates.layout_path` join, so migrating `templates` rows (layout_path + font/color columns) is sufficient; no per-certificate layout data to move.
- The **PDF generator's hardcoded mm-position duplication** is a maintenance trap: if a layout's position is changed in the `.php` file (web view) during/after migration, the same change must be mirrored in `generate_certificate.php`'s if/elseif chain or web and downloaded-PDF certs will visibly diverge.
- layout4/layout6 already have known inconsistencies between web and PDF (orientation mismatch, missing name-position branch) — worth deciding whether to fix these during the migration or carry them forward as-is.
