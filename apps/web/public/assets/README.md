# Web Asset Organization

This directory contains static assets served by the Next.js app from `/assets/...`.

## Structure

- `branding/` — official ICpEP Region 3 marks and hero/background artwork.
- `chapters/<school-slug>/` — each affiliated school's official logo and optional chapter cover.
- `people/regional-officers/<academic-year>/` — Region 3 officer portraits.
- `people/chapter-officers/<school-slug>/<academic-year>/` — chapter officer portraits.
- `people/professionals/` — advisers, speakers, industry partners, and guests.
- `events/<year>/` — event covers and posters.
- `placeholders/` — generic fallback images only.

## File naming

Use lowercase kebab-case filenames with no spaces.

Examples:

- `stephen-kurl-pinacate.webp`
- `general-assembly-2026.webp`
- `logo.png`
- `cover.webp`

Do not name officer portraits only by position (for example, `president.jpg`). Use the person's name so historical records remain unambiguous.

## Recommended image specifications

- Region 3 logo: SVG preferred, otherwise transparent PNG at 1600–2000 px square.
- Chapter logos: transparent PNG/SVG, ideally 800 × 800 px.
- Officer/professional portraits: WebP/JPG, 800 × 800 px, centered head-and-shoulders crop.
- Chapter/event covers: WebP, 1600 × 900 px.
- Posters/pubmats: preserve the original high-resolution aspect ratio.
- Hero backgrounds: WebP, at least 1920 × 1080 px.

## Database references

Store only the public asset path in the database, not the image bytes.

Examples:

```text
/assets/chapters/angeles-university-foundation/logo.png
/assets/people/chapter-officers/angeles-university-foundation/2026-2027/stephen-kurl-pinacate.webp
/assets/people/professionals/speakers/example-speaker.webp
/assets/events/2026/general-assembly/cover.webp
```

Only add verified official assets. Do not invent logos, officer photos, contact details, or professional profiles.
