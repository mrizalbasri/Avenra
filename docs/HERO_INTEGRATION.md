# Hero Six integration

The introduction at `/?intro=1` adapts the [SV Blocks Hero Six registry block](https://sv-blocks.vercel.app/d/hero-six.json), installed with:

```sh
cd apps/web
pnpm dlx shadcn-svelte@latest add https://sv-blocks.vercel.app/d/hero-six.json
```

The split headline, supporting copy, and large product preview follow the selected block. The header, actions, and feature overview are adapted to Avenra. Example company logos, placeholder authentication links, remote background imagery, and the mail screenshot were replaced with product content and a local fictional planning screenshot.

- `apps/web/components.json` configures the registry and native `#lib` imports.
- `apps/web/src/lib/components/dusk/hero/six/` contains the introduction.
- `apps/web/src/lib/components/ui/dusk/button/` contains the installed button.
- `apps/web/src/shadcn.css` maps button theme colors without changing workspace colors.

New workspaces see the introduction at `/`. Existing workspaces retain their overview and can open **About Avenra** from the desktop sidebar or visit `/?intro=1`. Returning to an existing workspace opens its plan list without creating another profile.

Verified locally: Svelte checks, production build, six existing Playwright scenarios, and a Chromium desktop/mobile walkthrough covering the menu, demo entry, return navigation, browser errors, and horizontal overflow at 390 px. Screenshots are under `docs/screenshots/landing-*.png`.
