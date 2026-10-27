<script lang="ts">
  import { Button } from '#lib/components/ui/dusk/button/index.js';
  import Header from './header.svelte';
  import LogoCloud from './logo-cloud.svelte';
  import logo from '#lib/assets/avenra.svg';
  import preview from '#lib/assets/planning-preview.png';
  let {
    hasProfile = false,
    busy,
    disabled,
    onOpen,
  }: {
    hasProfile?: boolean;
    busy: boolean;
    disabled: boolean;
    onOpen: () => Promise<void>;
  } = $props();
</script>

<div class="landing">
  <Header />
  <section class="hero-six" aria-labelledby="hero-title">
    <div class="hero-copy">
      <a class="eyebrow" href="/methodology"
        ><span class="status-dot"></span> YOUR ACADEMIC WORKSPACE
        <span aria-hidden="true">↗</span></a
      >
      <div class="intro-grid">
        <h1 id="hero-title">
          Your next chapter.<br /><span>Yours to plan.</span>
        </h1>
        <div class="intro-description">
          <p>
            University doesn't follow a straight line. Map your courses, explore
            another route, and build a study rhythm that works for you.
          </p>
          <div class="hero-actions">
            <Button size="lg" disabled={disabled || busy} onclick={onOpen}
              >{busy
                ? 'Opening workspace…'
                : hasProfile
                  ? 'Open your workspace'
                  : 'Open demo workspace'}
              <span aria-hidden="true">↗</span></Button
            >
            <a href="/curriculum">Use my curriculum →</a>
          </div>
          <small>No account needed | Fictional data in the demo</small>
        </div>
      </div>
    </div>
    <div class="preview-stage">
      <div class="preview-caption">
        <span>ONE PLAN. MORE POSSIBILITIES.</span><span
          >Canvas / Semester board / Recovery</span
        >
      </div>
      <div class="preview-window">
        <img
          src={preview}
          alt="Avenra academic canvas showing course cards connected by prerequisites across semesters"
          width="1440"
          height="1000"
          fetchpriority="high"
        />
      </div>
      <p class="preview-note">
        An example workspace | Your university's curriculum sets the rules.
      </p>
    </div>
  </section>
  <LogoCloud />
  <footer>
    <span class="footer-brand"
      ><img src={logo} alt="" width="30" height="24" />avenra.</span
    >
    <p>
      Planning support for students across Indonesia.<br />Discuss decisions
      with your academic advisor.
    </p>
    <a href="/methodology">Read our assumptions ↗</a>
  </footer>
</div>

<style>
  .landing {
    background: #09090b;
    color: #f5f5f7;
    min-height: 100vh;
  }
  .hero-copy {
    max-width: 1280px;
    margin: auto;
    padding: 84px 40px 60px;
  }
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #b4b4bd;
    font-size: 10px;
    letter-spacing: 1.6px;
    text-decoration: none;
  }
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f5f5f7;
  }
  .intro-grid {
    margin-top: 32px;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    align-items: end;
    gap: 64px;
  }
  h1 {
    font-size: clamp(48px, 5.8vw, 84px);
    line-height: 1.06;
    font-weight: 500;
    letter-spacing: -0.065em;
    margin: 0;
  }
  h1 span {
    color: #a1a1aa;
  }
  .intro-description {
    max-width: 410px;
    padding-bottom: 3px;
  }
  .intro-description p {
    font-size: 17px;
    color: #b4b4bd;
    line-height: 1.7;
    margin: 0 0 26px;
  }
  .hero-actions {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }
  .hero-actions a {
    font-size: 13px;
    text-decoration: none;
  }
  small {
    display: block;
    color: #a1a1aa;
    font-size: 11px;
    margin-top: 16px;
  }
  .preview-stage {
    max-width: 1200px;
    margin: 0 auto;
    background: #1c1c20;
    border-radius: 22px;
    padding: 26px 46px 0;
    overflow: hidden;
  }
  .preview-caption {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 10px;
    color: #d4d4d8;
    letter-spacing: 1.2px;
    padding-bottom: 26px;
  }
  .preview-caption span:last-child {
    letter-spacing: 0;
  }
  .preview-window {
    background: #111113;
    border: 1px solid #51515a;
    padding: 7px;
    border-radius: 12px;
    box-shadow: 0 24px 70px #0006;
    height: 470px;
    overflow: hidden;
  }
  .preview-window img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 6px;
  }
  .preview-note {
    color: #b4b4bd;
    font-size: 11px;
    padding: 17px 0;
    text-align: center;
    margin: 0;
  }
  footer {
    border-top: 1px solid #2c2c30;
    max-width: 1200px;
    margin: auto;
    padding: 32px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    color: #a1a1aa;
    font-size: 12px;
  }
  .footer-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  footer > span {
    color: #f5f5f7;
    font-size: 23px;
    font-weight: 600;
  }
  footer p {
    line-height: 1.7;
    margin: 0;
  }
  footer a {
    text-decoration: none;
  }
  @media (max-width: 1280px) {
    .preview-stage {
      margin: 0 24px;
    }
    footer {
      margin: 0 40px;
    }
  }
  @media (max-width: 720px) {
    .hero-copy {
      padding: 48px 24px 36px;
    }
    .intro-grid {
      grid-template-columns: 1fr;
      gap: 28px;
      margin-top: 24px;
    }
    h1 {
      font-size: clamp(43px, 10vw, 65px);
    }
    .intro-description {
      max-width: none;
    }
    .intro-description p {
      font-size: 16px;
    }
    .preview-stage {
      margin: 0 12px;
      padding: 20px 16px 0;
      border-radius: 16px;
    }
    .preview-caption {
      padding-bottom: 20px;
      letter-spacing: 0.7px;
    }
    .preview-caption span:last-child {
      display: none;
    }
    .preview-window {
      height: 290px;
    }
    .preview-window img {
      width: 740px;
      max-width: none;
    }
    .preview-note {
      font-size: 10px;
      line-height: 1.6;
    }
    footer {
      margin: 0 24px;
      flex-wrap: wrap;
      padding-bottom: 32px;
    }
  }
</style>
