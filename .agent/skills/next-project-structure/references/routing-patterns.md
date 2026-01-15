# Routing Patterns

## Dynamic Routes
Use square brackets to create dynamic segments.

* `[slug]`: Single dynamic segment (e.g., `/blog/1`). Params: `{ slug: '1' }`
* `[...slug]`: Catch-all segment (e.g., `/shop/clothes/tops`). Params: `{ slug: ['clothes', 'tops'] }`
* `[[...slug]]`: Optional catch-all (matches `/shop` and children).

## Route Groups
Wrap folders in parenthesis `(name)` to organize files without affecting the URL path.
* **Use Case:** Multiple Root Layouts. Create `app/(marketing)/layout.tsx` and `app/(dashboard)/layout.tsx` to have distinct HTML structures for different parts of the site.

## Parallel Routes (`@slot`)
Use primarily for split-views or complex dashboards.
* Convention: `@folderName`
* Allows rendering multiple pages in the same layout simultaneously.

## Intercepting Routes (`(.)`)
Use for modals that should be shareable via URL.
* `(.)folder`: Intercept same level
* `(..)folder`: Intercept parent level