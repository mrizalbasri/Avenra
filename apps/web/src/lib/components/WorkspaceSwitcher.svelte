<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '#lib/api.js';
  let { id, name }: { id?: string; name?: string } = $props();
  let workspaces = $state<{ id: string; name: string }[]>([]);
  let ready = $state(false);
  let error = $state('');
  let switching = $state(false);
  onMount(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('avenra-workspaces') ?? '[]',
      );
      if (Array.isArray(stored))
        workspaces = stored.filter(
          (w) => typeof w.id === 'string' && typeof w.name === 'string',
        );
    } catch {
      /* The current workspace remains available through its cookie. */
    }
    ready = true;
  });
  $effect(() => {
    if (ready && id && name) {
      const next = [...workspaces.filter((w) => w.id !== id), { id, name }];
      if (JSON.stringify(next) !== JSON.stringify(workspaces))
        workspaces = next;
      try {
        localStorage.setItem('avenra-workspaces', JSON.stringify(next));
      } catch {
        /* The selector is session-local if storage is blocked. */
      }
    }
  });
  async function switchTo(next: string) {
    if (next === 'new') {
      await goto('/curriculum');
      return;
    }
    error = '';
    switching = true;
    try {
      await goto('/');
      await api('workspace/switch', 'POST', { workspace_id: next });
      window.location.assign('/');
    } catch (e) {
      error = (e as Error).message;
      switching = false;
    }
  }
</script>

<label class="workspace-switcher"
  >Workspace<select
    aria-label="Switch workspace"
    disabled={switching}
    value={id ?? ''}
    onchange={(e) => switchTo(e.currentTarget.value)}
    >{#if !id}<option value="">Choose a workspace</option
      >{/if}{#each workspaces as w}<option value={w.id}>{w.name}</option
      >{/each}<option value="new">+ Import another curriculum</option></select
  ></label
>
{#if error}<p class="small" role="alert">{error}</p>{/if}
