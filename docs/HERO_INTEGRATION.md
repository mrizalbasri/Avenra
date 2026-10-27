# Hero Six integration

The introduction at `/?intro=1` adapts the [SV Blocks Hero Six registry block](https://sv-blocks.vercel.app/d/hero-six.json), installed with:

```sh
cd apps/web
pnpm dlx shadcn-svelte@latest add https://sv-blocks.vercel.app/d/hero-six.json
```

The interface now uses black, white, and neutral grays throughout the landing page and workspace. The white SVG logo follows the three-part mark selected from the emerald concept and also serves as the favicon. The split headline, supporting copy, and large product preview follow the selected block. The header, actions, and feature overview are adapted to Avenra. Example company logos, placeholder authentication links, remote background imagery, and the mail screenshot were replaced with product content and a local fictional planning screenshot.

- `apps/web/components.json` configures the registry and native `#lib` imports.
- `apps/web/src/lib/components/dusk/hero/six/` contains the introduction.
- `apps/web/src/lib/components/ui/dusk/button/` contains the installed button.
- `apps/web/src/shadcn.css` maps button theme colors without changing workspace colors.

New workspaces see the introduction at `/`. Existing workspaces retain their overview and can open **About Avenra** from the desktop sidebar or visit `/?intro=1`. Returning to an existing workspace opens its plan list without creating another profile.

Verified locally: Svelte checks, production build, six existing Playwright scenarios, and a Chromium desktop/mobile walkthrough covering the menu, demo entry, return navigation, browser errors, and horizontal overflow at 390 px. Screenshots are under `docs/screenshots/landing-*.png`.

## Features Five

The feature overview now adapts [SV Blocks Features Five](https://sv-blocks.vercel.app/d/features-five.json), installed with:

```sh
cd apps/web
pnpm dlx shadcn-svelte@latest add https://sv-blocks.vercel.app/d/features-five.json
```

`apps/web/src/lib/components/dusk/features/five.svelte` replaces the previous three-column overview. It retains the selected block's sticky feature navigation, scroll tracking, and copy/preview layout. Four sections cover academic canvas, recovery simulation, saved-plan comparison, and study/focus. Native anchor links support keyboard navigation; the navigation scrolls horizontally on small screens. The observer disconnects when the component unmounts.

Preview images under `apps/web/src/lib/assets/feature-*.png` are captured from the local application using fictional workspaces. They show existing functions, not new backend capabilities or live embedded controls. Placeholder CRM text, external portraits, and mock illustrations are removed. The page retains its monochrome palette and the white Avenra mark.

Verified locally: all four feature navigation targets, active section updates during scroll, keyboard activation, 390 px and 768 px layouts without horizontal page overflow, image loading, and no browser exceptions. Dedicated visual evidence is saved as `docs/screenshots/features-desktop.png` and `features-mobile.png`.

## Content Two

The section after Features Five adapts [SV Blocks Content Two](https://sv-blocks.vercel.app/d/content-two.json), installed using `pnpm dlx shadcn-svelte@latest add https://sv-blocks.vercel.app/d/content-two.json` from `apps/web`.

`apps/web/src/lib/components/dusk/content/two.svelte` retains the selected block's two-column heading and supporting content. Four ordered steps explain importing a curriculum, mapping semesters, simulating a change, and studying with focus sessions. The introduction header's **How it works** link now targets `#getting-started`. The section links to curriculum import and the actual methodology page and preserves the monochrome theme without adding another screenshot-heavy section.

Verified locally: four ordered steps, the introduction anchor, curriculum and methodology navigation, no browser exceptions, and no horizontal page overflow at 390 px and 768 px. Visual evidence is saved under `docs/screenshots/content-desktop.png` and `content-mobile.png`.
