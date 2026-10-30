# TeddyPups U.A.E. — Website

Production-ready reconstruction of [TeddyPups U.A.E.](https://puppy.instabizweb.com/), a boutique teacup and miniature puppy adoption platform in Dubai, U.A.E.

## 🚀 Features & Architecture

- **Framework**: Next.js 14 (App Router) with TypeScript & React 18.
- **Styling**: Tailwind CSS with custom theme matching the original site:
  - Custom Color Palette (`toffee`, `honey`, `cocoa`, `milk`, `sky`, `blush`)
  - Typography with Google Fonts (`Fraunces`, `Figtree`, `Shantell Sans`)
  - Custom sketch and vintage boarding-pass ticket styles.
- **Pages**:
  - `/` — Interactive landing page with hero, available puppy highlights, "Two Ways Home", gold standard promises, family stories, and FAQ preview.
  - `/puppies` — Live filterable catalog (Origin, Breed, Gender, Search).
  - `/puppies/[slug]` — Dynamic static-generated detail profiles for all puppies with image galleries, specs, and direct WhatsApp reservation.
  - `/gone-home` — Boarding pass wall of adopted alumni puppies.
  - `/happy-families` — Photo wall and customer testimonials across the UAE.
  - `/how-it-works` — Complete adoption walkthrough (Downtown Dubai showroom vs. overseas imports, UAE-wide delivery).
  - `/faq` — Collapsible categorized FAQs.
  - `/contact` — Interactive fill-in letter form, showroom map, direct lines.
- **Assets**: 100% self-contained local images and media stored in `public/media/` and `public/brand/`.
- **SEO & Meta**: Dynamic `sitemap.xml`, `robots.txt`, OpenGraph tags, and Schema.org rich snippets.

## 🛠️ Development & Deployment

### Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```
All 54 pages pre-render statically for instant load times and peak performance.

