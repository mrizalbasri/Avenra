# Hero Six integration

The introduction at `/?intro=1` adapts the [SV Blocks Hero Six registry block](https://sv-blocks.vercel.app/d/hero-six.json), installed with:

```sh
cd frontend
pnpm dlx shadcn-svelte@latest add https://sv-blocks.vercel.app/d/hero-six.json
```

The interface now uses black, white, and neutral grays throughout the landing page and workspace. The white SVG logo follows the three-part mark selected from the emerald concept and also serves as the favicon. The split headline, supporting copy, and large product preview follow the selected block. The header, actions, and feature overview are adapted to Avenra. Example company logos, placeholder authentication links, remote background imagery, and the mail screenshot were replaced with product content and a local fictional planning screenshot.

- `frontend/components.json` configures the registry and native `#lib` imports.
- `frontend/src/lib/components/dusk/hero/six/` contains the introduction.
- `frontend/src/lib/components/ui/dusk/button/` contains the installed button.
- `frontend/src/shadcn.css` maps button theme colors without changing workspace colors.

New workspaces see the introduction at `/`. Existing workspaces retain their overview and can open **About Avenra** from the desktop sidebar or visit `/?intro=1`. Returning to an existing workspace opens its plan list without creating another profile.

Verified locally: Svelte checks, production build, six existing Playwright scenarios, and a Chromium desktop/mobile walkthrough covering the menu, demo entry, return navigation, browser errors, and horizontal overflow at 390 px. Screenshots are under `docs/screenshots/landing-*.png`.

## Features Five

The feature overview now adapts [SV Blocks Features Five](https://sv-blocks.vercel.app/d/features-five.json), installed with:

```sh
cd frontend
pnpm dlx shadcn-svelte@latest add https://sv-blocks.vercel.app/d/features-five.json
```

`frontend/src/lib/components/dusk/features/five.svelte` replaces the previous three-column overview. It retains the selected block's sticky feature navigation, scroll tracking, and copy/preview layout. Four sections cover academic canvas, recovery simulation, saved-plan comparison, and study/focus. Native anchor links support keyboard navigation; the navigation scrolls horizontally on small screens. The observer disconnects when the component unmounts.

Preview images under `frontend/src/lib/assets/feature-*.png` are captured from the local application using fictional workspaces. They show existing functions, not new backend capabilities or live embedded controls. Placeholder CRM text, external portraits, and mock illustrations are removed. The page retains its monochrome palette and the white Avenra mark.

Verified locally: all four feature navigation targets, active section updates during scroll, keyboard activation, 390 px and 768 px layouts without horizontal page overflow, image loading, and no browser exceptions. Dedicated visual evidence is saved as `docs/screenshots/features-desktop.png` and `features-mobile.png`.

## Content Two

The section after Features Five adapts [SV Blocks Content Two](https://sv-blocks.vercel.app/d/content-two.json), installed using `pnpm dlx shadcn-svelte@latest add https://sv-blocks.vercel.app/d/content-two.json` from `frontend`.

`frontend/src/lib/components/dusk/content/two.svelte` retains the selected block's two-column heading and supporting content. Four ordered steps explain importing a curriculum, mapping semesters, simulating a change, and studying with focus sessions. The introduction header's **How it works** link now targets `#getting-started`. The section links to curriculum import and the actual methodology page and preserves the monochrome theme without adding another screenshot-heavy section.

Verified locally: four ordered steps, the introduction anchor, curriculum and methodology navigation, no browser exceptions, and no horizontal page overflow at 390 px and 768 px. Visual evidence is saved under `docs/screenshots/content-desktop.png` and `content-mobile.png`.

## FAQs One

The FAQ section after Content Two adapts [SV Blocks FAQs One](https://sv-blocks.vercel.app/d/faqs-one.json), installed with `pnpm dlx shadcn-svelte@latest add https://sv-blocks.vercel.app/d/faqs-one.json` from `frontend`.

`frontend/src/lib/components/dusk/faqs/one.svelte` uses the installed Bits UI accordion wrappers in `src/lib/components/ui/accordion/`. Six answers explain curriculum support, user-supplied rules, modeled validity, recovery scenarios, local storage, and the account-free fictional demo. Content follows the implemented boundaries in `docs/MVP_WORKSPACE.md`; the placeholder commerce and support copy has been removed. The methodology link opens the real rules page.

The registry utility alias now uses `#lib/utils`, avoiding duplicate `.js` extensions in generated imports. Accordion imports use explicit `.js` extensions and the shared utility exports the required `WithoutChild` type.

Verified locally: all six questions, single-open behavior, collapse, ArrowDown focus movement, Space activation, methodology navigation, and 390/768 px layouts without horizontal page overflow or browser exceptions. Screenshots are `docs/screenshots/faq-desktop.png` and `faq-mobile.png`.

## FAQ layout and motion refinement

The FAQ now uses one centered column (760 px maximum) with a centered heading, replacing the repeated two-column layout. Active rows use a subtle neutral fill and an animated plus/minus control. The six answers and methodology link remain the same.

A one-time viewport entrance uses the Web Animations API with a short vertical reveal. Accordion expansion/collapse animates the measured Bits UI content height. `prefers-reduced-motion` disables transitions and accordion animations; changing the preference also cancels an in-progress entrance. The viewport observer and media listener are cleaned up when the section unmounts. Content is visible by default when JavaScript is unavailable.

Verified locally: all six items, single-open behavior, collapse, ArrowDown/Space interaction, methodology navigation, and 390/768 px layouts without page overflow or browser exceptions. Browser inspection confirms the expansion animation runs normally and becomes `none` with reduced motion. Updated FAQ and landing screenshots show the new composition.

## Closing CTA, Footer, and Bilingual Landing (`en` / `id`)

`frontend/src/lib/components/dusk/call-to-action/one.svelte` and `frontend/src/lib/components/dusk/footer/footer.svelte` complete the landing page with a closing call-to-action and typographic monochrome footer. All landing sections (`Header`, `Hero`, `FeaturesFive`, `ContentTwo`, `FaqsOne`, `CallToActionOne`, `Footer`) read typed translations from `frontend/src/lib/i18n/en-landing.ts` and `id-landing.ts`, and `Header` includes `LanguageSwitcher` so new visitors can switch between English and Indonesian directly from `/`.
