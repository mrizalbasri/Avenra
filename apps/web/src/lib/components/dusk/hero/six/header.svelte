<script lang="ts">
  import logo from '#lib/assets/avenra.svg';
  let menuOpen = $state(false);
</script>

<header class="hero-nav">
  <a class="brand" href="/" aria-label="Avenra home"
    ><img src={logo} alt="" width="34" height="28" /><span>avenra.</span></a
  >
  <nav aria-label="Introduction navigation" class:expanded={menuOpen}>
    <a href="#getting-started" onclick={() => (menuOpen = false)}
      >How it works</a
    >
    <a href="/methodology">Rules & methodology</a>
    <a href="/curriculum" class="nav-action">Bring your curriculum ↗</a>
  </nav>
  <button
    class="menu-toggle"
    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
    aria-expanded={menuOpen}
    onclick={() => (menuOpen = !menuOpen)}>Menu {menuOpen ? '−' : '+'}</button
  >
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
      padding: 22px 24px;
      flex-wrap: wrap;
    }
    .menu-toggle {
      display: block;
    }
    nav {
      display: none;
      width: 100%;
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
