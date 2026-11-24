<script lang="ts">
  import logo from '#lib/assets/avenra.svg';
  import { useI18n } from '#lib/i18n/context.js';

  const { t } = useI18n();

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
</script>

<footer class="avenra-footer" aria-label={t('landing.footer.aria')}>
  <div class="footer-inner">
    <div class="footer-top">
      <a href="/" class="footer-mark" aria-label={t('landing.nav.home_aria')}>
        <img src={logo} alt="" width="40" height="34" />
      </a>
      <nav aria-label={t('landing.footer.nav_aria')}>
        <a href="/plans">{t('landing.footer.plans')}</a>
        <a href="/start">{t('landing.footer.import')}</a>
        <a href="/study">{t('landing.footer.study')}</a>
        <a href="/methodology">{t('landing.footer.methodology')}</a>
      </nav>
      <button type="button" onclick={scrollToTop}>
        {t('landing.footer.top')} <span aria-hidden="true">↑</span>
      </button>
    </div>

    <div class="brand-typographic" aria-hidden="true">avenra.</div>

    <div class="footer-bottom">
      <span>© 2026 Avenra</span>
      <span>{t('landing.footer.tagline')}</span>
    </div>
  </div>
</footer>

<style>
  .avenra-footer {
    border-top: 1px solid #232326;
    background: #09090b;
    color: #b4b4bd;
  }

  .footer-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 56px 40px 28px;
  }

  .footer-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 32px;
  }

  .footer-mark {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }

  nav {
    display: grid;
    grid-template-columns: repeat(2, auto);
    column-gap: 48px;
  }

  nav a,
  button {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: 13px;
    color: inherit;
    text-decoration: none;
  }

  button {
    gap: 12px;
    padding: 0;
    background: transparent;
    border: 0;
    cursor: pointer;
    font-family: inherit;
  }

  a:hover,
  button:hover {
    color: #fff;
  }

  a:focus-visible,
  button:focus-visible {
    outline: 2px solid #f5f5f7;
    outline-offset: 5px;
    border-radius: 2px;
  }

  .brand-typographic {
    margin: 64px 0 36px;
    font-size: clamp(80px, 22vw, 300px);
    font-weight: 700;
    letter-spacing: -0.065em;
    line-height: 0.9;
    color: #f5f5f7;
    user-select: none;
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 12px;
    line-height: 1.5;
    color: #a1a1aa;
  }

  @media (max-width: 720px) {
    .footer-inner {
      padding: 36px 24px 24px;
    }

    .footer-top {
      flex-wrap: wrap;
      gap: 24px;
    }

    nav {
      margin-left: auto;
      column-gap: 24px;
    }

    .brand-typographic {
      margin: 40px 0 28px;
      font-size: clamp(72px, 23vw, 166px);
    }

    .footer-bottom {
      flex-wrap: wrap;
      gap: 8px 24px;
    }
  }

  @media (max-width: 380px) {
    nav {
      width: 100%;
      margin-left: 0;
    }
  }
</style>
