# File Conventions & Hierarchy

## Component Hierarchy
When multiple special files exist in the same segment, they nest in this exact order (outer to inner):

1.  `layout.js`
2.  `template.js`
3.  `error.js` (React Error Boundary)
4.  `loading.js` (React Suspense Boundary)
5.  `not-found.js` (Error Boundary)
6.  `page.js` or nested `layout.js`

## Reserved File Names

| File | Extension | Purpose |
| :--- | :--- | :--- |
| `layout` | .js .jsx .tsx | Shared UI for a segment and its children |
| `page` | .js .jsx .tsx | Unique UI of a route; makes the route public |
| `loading` | .js .jsx .tsx | Loading UI (Suspense fallback) |
| `not-found` | .js .jsx .tsx | UI for 404 errors |
| `error` | .js .jsx .tsx | UI for general errors |
| `global-error` | .js .jsx .tsx | UI for global errors (replaces root layout) |
| `route` | .js .ts | Server-side API endpoint |
| `default` | .js .jsx .tsx | Fallback for Parallel Routes |

## Metadata Files
* `favicon.ico`, `icon.tsx` (App Icons)
* `opengraph-image.tsx`, `twitter-image.tsx` (Social Cards)
* `sitemap.ts`, `robots.ts` (SEO)