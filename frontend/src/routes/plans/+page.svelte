<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import Icon from '#lib/components/Icon.svelte';
  import { useI18n } from '#lib/i18n/context.js';
  import type { Plan } from '#lib/types.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { t, msg } = useI18n();
  let name = $state('');
  let busy = $state(false);
  let error = $state('');
  let notice = $state('');
  let archived = $state(false);
  let plans = $derived(
    data.workspace?.plans.filter((p) => p.archived === archived) ?? [],
  );
  async function create(copy?: Plan) {
    if (!copy && !name.trim()) return;
    busy = true;
    error = '';
    notice = '';
    try {
      const plan = await api<Plan>('plans', 'POST', {
        name: copy ? t('plans.copy_name', { name: copy.name }) : name,
        copy_from: copy?.id ?? null,
      });
      await invalidateAll();
      await goto(`/plans/${plan.id}`);
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
  async function makePrimary(plan: Plan) {
    busy = true;
    error = '';
    notice = '';
    try {
      await api<Plan>(`plans/${plan.id}/primary`, 'POST', {});
      await invalidateAll();
      notice = t('plans.primary_updated', { name: plan.name });
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
  async function removePlan(plan: Plan) {
    if (!window.confirm(t('plans.delete_confirm', { name: plan.name }))) return;
    busy = true;
    error = '';
    notice = '';
    try {
      await api(`plans/${plan.id}`, 'DELETE');
      try {
        localStorage.removeItem(`avenra-plan-draft:${plan.id}`);
        localStorage.removeItem(`avenra-passport-notes:${plan.id}`);
      } catch {
        /* Storage access is optional. */
      }
      await invalidateAll();
      notice = t('plans.deleted');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>{t('plans.title')}</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>{t('plans.heading')}</h1>
    <p>{t('plans.lead')}</p>
  </div>
</div>
{#if !data.workspace?.profile}<div class="empty-panel">
    <h2>{t('plans.start')}</h2>
    <p>{t('plans.start_hint')}</p>
    <a href="/" class="button primary">{t('plans.go_overview')}</a>
  </div>{:else}
  <form
    class="inline-create"
    onsubmit={(e) => {
      e.preventDefault();
      create();
    }}
  >
    <label for="plan-name">{t('plans.new_name')}</label><input
      id="plan-name"
      bind:value={name}
      placeholder={t('plans.name_placeholder')}
      maxlength="100"
      required
    /><button class="button primary" disabled={busy}
      ><Icon name="plus" size={16} />{t('plans.create')}</button
    >
  </form>
  {#if error}<p class="error-banner" role="alert">{error}</p>{/if}
  {#if notice}<p class="success-banner" role="status">{notice}</p>{/if}
  <div class="section-heading">
    <div class="segmented">
      <button class:chosen={!archived} onclick={() => (archived = false)}
        >{t('plans.active')}</button
      ><button class:chosen={archived} onclick={() => (archived = true)}
        >{t('plans.archived')}</button
      >
    </div>
    <span class="muted small">{t('plans.count', { count: plans.length })}</span>
  </div>
  <div class="plan-grid">
    {#each plans as plan}<article class="plan-tile">
        <div class="tile-top">
          <Icon name="plans" />
          <div class="tile-tags">
            {#if plan.is_primary && !archived}<span class="tag"
                >{t('plans.primary_tag')}</span
              >{/if}<span
              class="tag"
              class:warning={!!plan.validation.findings.length}
              >{plan.validation.findings.length
                ? t('plans.needs_review')
                : t('overview.plans.valid')}</span
            >
          </div>
        </div>
        <h2><a href={`/plans/${plan.id}`}>{plan.name}</a></h2>
        <p>
          {t('plans.tile_meta', {
            remaining: plan.validation.remaining_credits,
            cap: plan.credit_cap,
          })}
        </p>
        <p class="small muted">
          {plan.validation.completion_term
            ? t('plan.completion', { term: plan.validation.completion_term })
            : t('plans.findings_review', {
                count: plan.validation.findings.length,
              })}
        </p>
        <div class="tile-actions">
          <a class="button" href={`/plans/${plan.id}`}
            >{archived
              ? t('plans.view_restore')
              : t('overview.plans.open')}<Icon name="arrow" size={15} /></a
          >{#if !archived && !plan.is_primary}<button
              class="button subtle"
              disabled={busy}
              onclick={() => makePrimary(plan)}
              ><Icon name="star" size={15} />{t('plans.set_primary')}</button
            >{/if}<button
            class="button icon-button"
            aria-label={t('plans.duplicate', { name: plan.name })}
            disabled={busy}
            onclick={() => create(plan)}><Icon name="copy" size={17} /></button
          ><button
            class="button icon-button subtle"
            aria-label={t('plans.delete_aria', { name: plan.name })}
            disabled={busy}
            onclick={() => removePlan(plan)}
            ><Icon name="trash" size={16} /></button
          >
        </div>
      </article>{/each}
  </div>
  {#if !plans.length}<div class="empty-panel">
      <h2>
        {archived ? t('plans.empty_archived') : t('plans.empty_active')}
      </h2>
      <p>
        {archived
          ? t('plans.empty_archived_hint')
          : t('plans.empty_active_hint')}
      </p>
    </div>{/if}
{/if}
