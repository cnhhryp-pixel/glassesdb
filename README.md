# GlassesDB

Static-first smart glasses database for **https://glassesdb.com**.

## Included in V1

- Homepage
- Searchable/filterable database
- Guided smart glasses finder
- Three-model comparison tool
- Brands directory
- Feature explainer hub
- Use-case hub
- Methodology / sources page
- Responsive design
- Sitemap, robots.txt, favicon and custom 404
- Static-hosting headers

## Architecture

Plain HTML, CSS and JavaScript. No server runtime, database service or framework is required.

Product data lives in:

`assets/data.js`

This keeps V1 easy to deploy on Cloudflare Pages and easy to migrate to a generated-data workflow later.

## Cloudflare Pages

Use this repository as the production source.

- Production branch: `main`
- Framework preset: None
- Build command: leave blank
- Build output directory: `/`

Then attach the custom domain `glassesdb.com`.

## Data policy

Prefer official manufacturer sources. Keep uncertain or model-dependent specifications explicitly labeled instead of guessing.
