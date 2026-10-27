<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import {
    Background,
    Controls,
    SvelteFlow,
    type Node,
    type Edge,
    Position,
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let nodes = $state.raw<Node[]>([]);
  let edges = $state.raw<Edge[]>([]);
  let message = $state('Drag a course to explore the canvas.');
  let refreshing = $state(false);

  function reset() {
    const courses = data.curriculum?.courses ?? [];
    nodes = courses.map((course, index) => ({
      id: course.code,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      position: {
        x: (course.recommended_term - 1) * 300,
        y: (index % 2) * 150 + 65,
      },
      data: {
        label: `${course.code} · ${course.credits} credits\n${course.name}`,
      },
      style:
        'width: 230px; padding: 24px 16px; border: 1px solid #b5c5b8; border-radius: 10px; background: #fff; color: #253d2d; white-space: pre-line; font-size: 13px; line-height: 1.7;',
    }));
    edges = courses.flatMap((course) =>
      course.prerequisites.map((prerequisite) => ({
        id: `${prerequisite}-${course.code}`,
        source: prerequisite,
        target: course.code,
        deletable: false,
        style: 'stroke: #7c9581; stroke-width: 1.5;',
      })),
    );
  }

  onMount(() => {
    reset();
    try {
      const saved = JSON.parse(
        localStorage.getItem('avenra-demo-layout-v1') ?? 'null',
      );
      if (saved && typeof saved === 'object') {
        nodes = nodes.map((node) => {
          const point = saved[node.id];
          return point && Number.isFinite(point.x) && Number.isFinite(point.y)
            ? { ...node, position: { x: point.x, y: point.y } }
            : node;
        });
      }
    } catch {
      message =
        'Saved layout could not be restored. The default layout is ready.';
    }
  });

  function saveLayout() {
    try {
      localStorage.setItem(
        'avenra-demo-layout-v1',
        JSON.stringify(
          Object.fromEntries(nodes.map((node) => [node.id, node.position])),
        ),
      );
      message =
        'Layout saved in this browser. Academic assignments are unchanged.';
    } catch {
      message =
        'Browser storage is unavailable. Your layout has not been saved.';
    }
  }

  async function refresh() {
    refreshing = true;
    try {
      await invalidateAll();
      reset();
    } finally {
      refreshing = false;
    }
  }
</script>

<svelte:head>
  <title>Avenra — Academic planning workspace</title>
  <meta
    name="description"
    content="Explore Avenra: a synthetic curriculum canvas and local service status."
  />
</svelte:head>

<div class="workspace">
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="Avenra home"
      ><span class="brand-mark">a</span> avenra.</a
    >
    <p class="section-label">YOUR WORKSPACE</p>
    <div class="active-nav">▦ &nbsp; Curriculum canvas</div>
    <div class="sidebar-note">
      <span class="section-label">COMING NEXT</span>
      <p>Saved study plans</p>
      <p>Recovery scenarios</p>
      <p>Learning goals & focus</p>
    </div>
    <div class="sidebar-footer">
      <strong>A clearer path forward.</strong>
      <p>Plan thoughtfully.<br />Understand the possibilities.</p>
      <span>FOUNDATION · v0.1</span>
    </div>
  </aside>
  <main>
    <header class="topbar">
      <span>Workspace / Curriculum overview</span><span class="demo-badge"
        >SYNTHETIC DEMO</span
      >
    </header>
    <section class="intro">
      <div>
        <p class="eyebrow">MAKE ROOM FOR WHAT'S NEXT</p>
        <h1>Your path, in perspective.</h1>
        <p class="subtitle">
          Explore how courses connect. A starting point for your academic plans.
        </p>
      </div>
      <button class="refresh" onclick={refresh} disabled={refreshing}
        >{refreshing ? 'Checking…' : 'Refresh services ↗'}</button
      >
    </section>
    <section class="status-grid" aria-label="Service status">
      <div class="status-card">
        <span>01 / APPLICATION</span><strong>Web workspace ready</strong><small
          >SvelteKit + Svelte Flow</small
        >
      </div>
      <div class="status-card">
        <span>02 / API</span><strong
          >{data.apiOnline ? 'API connected' : 'API unavailable'}</strong
        ><small>FastAPI · JSON endpoints</small>
      </div>
      <div class="status-card">
        <span>03 / STORAGE</span><strong
          >{data.databaseOnline
            ? 'Database connected'
            : 'Database unavailable'}</strong
        ><small>PostgreSQL · local development</small>
      </div>
    </section>
    <section class="canvas-shell" aria-label="Curriculum exploration">
      <div class="canvas-toolbar">
        <div>
          <h2>Curriculum canvas</h2>
          <span
            >Computing / {data.curriculum?.version ?? 'waiting for API'}</span
          >
        </div>
        <div class="actions">
          <button
            onclick={() => {
              reset();
              message =
                'Default layout restored. Save to keep this arrangement.';
            }}>Reset layout</button
          ><button
            class="primary"
            onclick={saveLayout}
            disabled={!data.curriculum}>Save layout</button
          >
        </div>
      </div>
      <div class="term-labels" aria-hidden="true">
        <span>01 — Foundations</span><span>02 — Build on the basics</span><span
          >03 — Connect your knowledge</span
        >
      </div>
      <div class="canvas">
        {#if data.curriculum}
          <SvelteFlow
            bind:nodes
            {edges}
            fitView
            nodesConnectable={false}
            deleteKey={null}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background patternColor="#c6cfc4" gap={22} /><Controls />
          </SvelteFlow>
        {:else}
          <div class="empty">
            <h3>Start the API to load the curriculum.</h3>
            <p>
              Follow the README startup instructions, then refresh services.
            </p>
          </div>
        {/if}
      </div>
      <div class="canvas-footer">
        <span aria-live="polite">{message}</span><span
          >Drag to move · Scroll to zoom</span
        >
      </div>
    </section>
    <footer class="notice">
      <strong>A space to explore, with clear boundaries.</strong>
      <p>
        {data.curriculum?.disclaimer ?? 'Synthetic demonstration data only.'} Card
        positions are visual only. Semester reassignment, academic validation, recovery
        generation, and learning tools are planned.
      </p>
    </footer>
  </main>
</div>

<style>
  .workspace {
    display: grid;
    grid-template-columns: 230px minmax(0, 1fr);
    min-height: 100vh;
  }
  .sidebar {
    background: #edf0e8;
    border-right: 1px solid #dce2d7;
    padding: 35px 22px;
    display: flex;
    flex-direction: column;
  }
  .brand {
    display: flex;
    align-items: center;
    color: #243d2e;
    font-size: 29px;
    font-weight: 650;
    letter-spacing: -1.5px;
    text-decoration: none;
    margin-bottom: 65px;
  }
  .brand-mark {
    display: grid;
    place-items: center;
    background: #284b37;
    color: #eef3e8;
    width: 34px;
    height: 34px;
    border-radius: 12px 12px 3px 12px;
    margin-right: 10px;
    font-family: Georgia, serif;
    font-style: italic;
  }
  .section-label {
    font-size: 10px;
    letter-spacing: 1.7px;
    color: #65705d;
    font-weight: 700;
  }
  .active-nav {
    background: #dce5d4;
    color: #294632;
    padding: 14px 10px;
    border-radius: 7px;
    font-size: 13px;
    margin-top: 10px;
  }
  .sidebar-note {
    margin-top: 35px;
    padding: 0 10px;
    font-size: 13px;
    color: #65705d;
  }
  .sidebar-note p {
    margin: 19px 0;
  }
  .sidebar-footer {
    margin-top: auto;
    padding-top: 65px;
    font-size: 12px;
    color: #63705d;
  }
  .sidebar-footer p {
    line-height: 1.9;
  }
  .sidebar-footer span {
    display: block;
    font-size: 9px;
    letter-spacing: 1.5px;
    margin-top: 25px;
  }
  main {
    padding: 0 38px 30px;
    min-width: 0;
  }
  .topbar {
    min-height: 78px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e1e5dc;
    color: #687261;
    font-size: 12px;
    gap: 12px;
  }
  .demo-badge {
    font-size: 9px;
    letter-spacing: 1.3px;
    border: 1px solid #d9dfd0;
    padding: 7px 10px;
    border-radius: 4px;
    white-space: nowrap;
  }
  .intro {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin: 36px 0 28px;
  }
  .eyebrow {
    font-size: 9px;
    letter-spacing: 2px;
    color: #63724b;
    font-weight: 700;
  }
  h1 {
    font-family: Georgia, serif;
    font-weight: 400;
    font-size: clamp(28px, 3vw, 43px);
    letter-spacing: -1.5px;
    margin: 12px 0;
  }
  .subtitle {
    color: #63705b;
    font-size: 13px;
    line-height: 1.7;
  }
  .refresh {
    border: 0;
    background: transparent;
    color: #426047;
    font-size: 12px;
    white-space: nowrap;
  }
  .status-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }
  .status-card {
    background: #fcfdf9;
    border: 1px solid #e0e5d9;
    border-radius: 7px;
    padding: 19px;
    display: flex;
    flex-direction: column;
    gap: 13px;
  }
  .status-card > span {
    font-size: 9px;
    letter-spacing: 1.3px;
    color: #66725a;
  }
  .status-card strong {
    font-size: 13px;
    font-weight: 550;
  }
  .status-card small {
    font-size: 11px;
    color: #647058;
  }
  .canvas-shell {
    border: 1px solid #dce2d5;
    border-radius: 9px;
    overflow: hidden;
    background: #fcfdf9;
  }
  .canvas-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 19px 22px;
    gap: 15px;
    border-bottom: 1px solid #e3e8dc;
  }
  h2 {
    margin: 0 0 5px;
    font-size: 14px;
    font-weight: 600;
  }
  .canvas-toolbar span {
    font-size: 11px;
    color: #65705b;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
  .actions button {
    border: 1px solid #d6ddce;
    color: #526048;
    background: #fff;
    border-radius: 5px;
    padding: 8px 12px;
    font-size: 11px;
  }
  .actions button.primary {
    background: #2d4d38;
    color: #fff;
    border-color: #2d4d38;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .term-labels {
    display: flex;
    justify-content: space-around;
    gap: 12px;
    padding: 18px 20px 4px;
    font-size: 10px;
    color: #647255;
  }
  .canvas {
    height: 380px;
    width: 100%;
  }
  .canvas-footer {
    border-top: 1px solid #e3e8dc;
    padding: 12px 18px;
    display: flex;
    justify-content: space-between;
    gap: 15px;
    font-size: 10px;
    color: #647255;
  }
  .notice {
    margin: 23px 0 0;
    max-width: 850px;
    font-size: 11px;
    color: #65715c;
    line-height: 1.8;
  }
  .notice strong {
    font-weight: 550;
    color: #56634c;
  }
  .notice p {
    margin: 4px 0;
  }
  .empty {
    display: grid;
    align-content: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
    font-size: 13px;
  }
  @media (max-width: 1000px) {
    .workspace {
      grid-template-columns: 185px minmax(0, 1fr);
    }
    main {
      padding-inline: 22px;
    }
    .sidebar {
      padding-inline: 14px;
    }
    .status-card {
      padding: 14px;
    }
  }
  @media (max-width: 720px) {
    .workspace {
      display: block;
    }
    .sidebar {
      padding: 16px 20px;
      border-right: 0;
      border-bottom: 1px solid #dce2d7;
    }
    .brand {
      margin: 0;
      font-size: 24px;
    }
    .sidebar > :not(.brand) {
      display: none;
    }
    main {
      padding-inline: 16px;
    }
    .topbar {
      min-height: 57px;
    }
    .intro {
      margin-top: 24px;
      align-items: flex-start;
      flex-direction: column;
      gap: 0;
    }
    .status-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    .status-card {
      gap: 8px;
    }
    .canvas-toolbar {
      flex-wrap: wrap;
      padding: 15px;
    }
    .canvas-footer {
      flex-direction: column;
      gap: 6px;
    }
    .term-labels {
      font-size: 9px;
    }
  }
</style>
