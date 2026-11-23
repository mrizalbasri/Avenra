<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import Icon from '#lib/components/Icon.svelte';
  import WorkspaceSwitcher from '#lib/components/WorkspaceSwitcher.svelte';
  import LanguageSwitcher from '#lib/components/LanguageSwitcher.svelte';
  import { provideI18n, useI18n } from '#lib/i18n/context.js';
  import favicon from '#lib/assets/avenra.svg';
  import type { LayoutProps } from './$types';
  let { children, data }: LayoutProps = $props();
  provideI18n(() => data.locale);
  const { t } = useI18n();
  // The server sets lang on first render; keep it in step after a client-side switch.
  $effect(() => {
    document.documentElement.lang = data.locale;
  });
  let landing = $derived(
    page.url.pathname === '/' &&
      (!data.workspace?.profile || page.url.searchParams.has('intro')),
  );
  const navigation = [
    {
      href: '/',
      key: 'nav.overview',
      short: 'nav.overview.short',
      icon: 'home',
    },
    {
      href: '/plans',
      key: 'nav.plans',
      short: 'nav.plans.short',
      icon: 'plans',
    },
    {
      href: '/compare',
      key: 'nav.compare',
      short: 'nav.compare.short',
      icon: 'compare',
    },
    {
      href: '/study',
      key: 'nav.study',
      short: 'nav.study.short',
      icon: 'study',
    },
    {
      href: '/profile',
      key: 'nav.profile',
      short: 'nav.profile.short',
      icon: 'profile',
    },
  ] as const;
</script>

<svelte:head
  ><link rel="icon" href={favicon} /><meta
    name="theme-color"
    content="#09090b"
  /></svelte:head
>
{#if landing}<main id="main-content" class:landing-main={landing}>
    {#if data.workspaceError}<div class="error-banner" role="alert">
        {data.workspaceError}<button
          class="button subtle"
          onclick={() => invalidateAll()}>{t('layout.retry')}</button
        >
      </div>{/if}{@render children()}
  </main>{:else}<div class="app-shell">
    <aside class="app-sidebar no-print">
      <a href="/" class="logo"
        ><img src={favicon} alt="" width="34" height="28" />avenra.</a
      >
      <nav aria-label={t('nav.main')}>
        {#each navigation as item}<a
            href={item.href}
            class:active={item.href === '/'
              ? page.url.pathname === '/'
              : page.url.pathname.startsWith(item.href)}
            aria-current={(
              item.href === '/'
                ? page.url.pathname === '/'
                : page.url.pathname.startsWith(item.href)
            )
              ? 'page'
              : undefined}
            ><Icon name={item.icon} size={18} /><span class="label-full"
              >{t(item.key)}</span
            ><span class="label-short" aria-hidden="true">{t(item.short)}</span
            ></a
          >{/each}
      </nav>
      <div class="sidebar-bottom">
        <a href="/?intro=1"
          ><Icon name="home" size={16} />{t('sidebar.about')}</a
        >
        <a href="/methodology"
          ><Icon name="info" size={16} /> {t('sidebar.methodology')}</a
        >
        <LanguageSwitcher class="in-sidebar" />
        <div class="identity">
          <span class="avatar"
            >{data.workspace?.profile?.alias?.[0] ?? 'A'}</span
          >
          <div>
            <strong
              >{data.workspace?.profile?.alias ??
                t('sidebar.workspace')}</strong
            ><small
              >{data.workspace?.curriculum.status === 'synthetic'
                ? t('sidebar.identity.synthetic')
                : t('sidebar.identity.own')}</small
            >
          </div>
        </div>
      </div>
    </aside>
    <div class="app-main">
      <header class="app-topbar no-print">
        <WorkspaceSwitcher
          id={data.workspace?.profile?.id}
          name={data.workspace?.profile?.alias}
        />
        <div>
          <LanguageSwitcher class="in-topbar" />
          <span class="connection-dot" class:disconnected={!data.workspace}
          ></span><span
            >{data.workspace
              ? t('topbar.connected')
              : t('topbar.unavailable')}</span
          >{#if data.workspace?.profile}<span class="tag"
              >{data.workspace.curriculum.status === 'synthetic'
                ? t('topbar.curriculum.example')
                : t('topbar.curriculum.own')}</span
            >{/if}
        </div>
      </header>
      <main id="main-content" class:landing-main={landing}>
        {#if data.workspaceError}<div class="error-banner" role="alert">
            {data.workspaceError}<button
              class="button subtle"
              onclick={() => invalidateAll()}>{t('layout.retry')}</button
            >
          </div>{/if}
        {#key page.url.pathname}{@render children()}{/key}
      </main>
    </div>
  </div>
{/if}
