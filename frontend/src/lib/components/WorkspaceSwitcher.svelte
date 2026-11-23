<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { requestApi } from '#lib/api.js';
  import { useI18n } from '#lib/i18n/context.js';
  import { selectWorkspace, validWorkspaceId } from '#lib/workspace.js';
  import type { Workspace } from '#lib/types.js';
  let { id, name }: { id?: string; name?: string } = $props();
  const { t, msg } = useI18n();
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
      await goto('/start');
      return;
    }
    error = '';
    switching = true;
    try {
      if (!validWorkspaceId(next)) throw new Error(t('ws.invalid'));
      const workspace = await requestApi<Workspace>(fetch, 'workspace', next);
      if (!workspace.profile) throw new Error(t('ws.not_found'));
      selectWorkspace(next);
      window.location.assign('/');
    } catch (e) {
      error = msg.errorText(e);
      switching = false;
    }
  }
</script>

<label class="workspace-switcher"
  >{t('ws.label')}<select
    aria-label={t('ws.aria')}
    disabled={switching}
    value={id ?? ''}
    onchange={(e) => switchTo(e.currentTarget.value)}
    >{#if !id}<option value="">{t('ws.choose')}</option
      >{/if}{#each workspaces as w}<option value={w.id}>{w.name}</option
      >{/each}<option value="new">{t('ws.import')}</option></select
  ></label
>
{#if error}<p class="small" role="alert">{error}</p>{/if}
