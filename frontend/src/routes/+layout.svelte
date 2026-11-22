<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import Icon from '#lib/components/Icon.svelte';
  import WorkspaceSwitcher from '#lib/components/WorkspaceSwitcher.svelte';
  import favicon from '#lib/assets/avenra.svg';
  import type { LayoutProps } from './$types';
  let { children, data }: LayoutProps = $props();
  let landing = $derived(
    page.url.pathname === '/' &&
      (!data.workspace?.profile || page.url.searchParams.has('intro')),
  );
  const navigation = [
    { href: '/', label: 'Overview', short: 'Today', icon: 'home' },
    { href: '/plans', label: 'Study plans', short: 'Plans', icon: 'plans' },
    {
      href: '/compare',
      label: 'Compare plans',
      short: 'Compare',
      icon: 'compare',
    },
    { href: '/study', label: 'Study & focus', short: 'Study', icon: 'study' },
    {
      href: '/profile',
      label: 'Academic profile',
      short: 'Profile',
      icon: 'profile',
    },
  ];
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
          onclick={() => invalidateAll()}>Retry connection</button
        >
      </div>{/if}{@render children()}
  </main>{:else}<div class="app-shell">
    <aside class="app-sidebar no-print">
      <a href="/" class="logo"
        ><img src={favicon} alt="" width="34" height="28" />avenra.</a
      >
      <nav aria-label="Main navigation">
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
              >{item.label}</span
            ><span class="label-short" aria-hidden="true">{item.short}</span></a
          >{/each}
      </nav>
      <div class="sidebar-bottom">
        <a href="/?intro=1"><Icon name="home" size={16} />About Avenra</a>
        <a href="/methodology"
          ><Icon name="info" size={16} /> Rules & methodology</a
        >
        <div class="identity">
          <span class="avatar"
            >{data.workspace?.profile?.alias?.[0] ?? 'A'}</span
          >
          <div>
            <strong>{data.workspace?.profile?.alias ?? 'Your workspace'}</strong
            ><small
              >Local prototype | {data.workspace?.curriculum.status ===
              'synthetic'
                ? 'Synthetic data'
                : 'Your curriculum'}</small
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
          <span class="connection-dot" class:disconnected={!data.workspace}
          ></span><span
            >{data.workspace
              ? 'Workspace connected'
              : 'Workspace unavailable'}</span
          ><span class="tag">DEMO</span>
        </div>
      </header>
      <main id="main-content" class:landing-main={landing}>
        {#if data.workspaceError}<div class="error-banner" role="alert">
            {data.workspaceError}<button
              class="button subtle"
              onclick={() => invalidateAll()}>Retry connection</button
            >
          </div>{/if}
        {#key page.url.pathname}{@render children()}{/key}
      </main>
    </div>
  </div>
{/if}
