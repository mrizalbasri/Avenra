<script lang="ts">
  import logo from '#lib/assets/avenra.svg';
  import LanguageSwitcher from '#lib/components/LanguageSwitcher.svelte';
  import { useI18n } from '#lib/i18n/context.js';

  const { t } = useI18n();
  let menuOpen = $state(false);
</script>

<header class="hero-nav">
  <a class="brand" href="/" aria-label={t('landing.nav.home_aria')}
    ><img src={logo} alt="" width="34" height="28" /><span>avenra.</span></a
  >
  <nav aria-label={t('landing.nav.aria')} class:expanded={menuOpen}>
    <a href="#getting-started" onclick={() => (menuOpen = false)}
      >{t('landing.nav.how')}</a
    >
    <a href="/methodology">{t('landing.nav.methodology')}</a>
    <a href="/start" class="nav-action">{t('landing.nav.bring')} ↗</a>
  </nav>
  <div class="header-controls">
    <LanguageSwitcher />
    <button
      class="menu-toggle"
      aria-label={menuOpen
        ? t('landing.nav.close_menu')
        : t('landing.nav.open_menu')}
      aria-expanded={menuOpen}
      onclick={() => (menuOpen = !menuOpen)}
      >{t('landing.nav.menu')} {menuOpen ? '−' : '+'}</button
    >
  </div>
</header>

<style>
  .hero-nav {
    max-width: 1280px;
    margin: auto;
    padding: 26px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 29px;
    font-weight: 700;
    letter-spacing: -1.5px;
    text-decoration: none;
  }
  .brand span {
    color: #f5f5f7;
  }
  nav {
    display: flex;
    gap: 32px;
    align-items: center;
    font-size: 13px;
    color: #b4b4bd;
    margin-left: auto;
  }
  nav a {
    text-decoration: none;
  }
  nav a:hover {
    color: white;
  }
  .nav-action {
    border: 1px solid #3f3f46;
    border-radius: 99px;
    padding: 11px 18px;
    color: #f5f5f7;
  }
  .header-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .menu-toggle {
    display: none;
    background: transparent;
    color: inherit;
    border: 1px solid #3f3f46;
    border-radius: 99px;
    padding: 10px 16px;
  }
  @media (max-width: 720px) {
    .hero-nav {
      padding: 22px 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .brand {
      font-size: 24px;
    }
    .menu-toggle {
      display: block;
      padding: 8px 14px;
      font-size: 13px;
    }
    nav {
      display: none;
      width: 100%;
      margin-left: 0;
      order: 3;
      flex-direction: column;
      align-items: stretch;
      gap: 20px;
      padding: 16px 0;
    }
    nav.expanded {
      display: flex;
    }
  }
</style>
