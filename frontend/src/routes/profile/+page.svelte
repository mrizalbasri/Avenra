<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import { useI18n } from '#lib/i18n/context.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { t, msg } = useI18n();
  let alias = $state(untrack(() => data.workspace?.profile?.alias ?? ''));
  let currentTerm = $state(
    untrack(() => data.workspace?.profile?.current_term ?? 2),
  );
  let completed = $state<string[]>(
    untrack(() => [...(data.workspace?.profile?.completed ?? [])]),
  );
  let revision = $state(untrack(() => data.workspace?.profile?.revision ?? 1));
  let lastGpa = $state<number | null>(
    untrack(() => data.workspace?.profile?.last_gpa ?? null),
  );
  let notice = $state('');
  let busy = $state(false);
  let error = $state('');
  async function save() {
    busy = true;
    error = '';
    notice = '';
    try {
      const profile = await api<{ revision: number }>('profile', 'PATCH', {
        alias,
        current_term: currentTerm,
        completed,
        last_gpa: lastGpa,
        revision,
      });
      revision = profile.revision;
      await invalidateAll();
      notice = t('profile.saved');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>{t('profile.title')}</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>{t('profile.heading')}</h1>
    <p>{t('profile.lead')}</p>
  </div>
</div>
{#if data.workspace?.profile}<form
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
  >
    <section class="panel profile-form">
      <h2>{t('profile.panel')}</h2>
      <p class="muted">{t('profile.alias_hint')}</p>
      <div class="form-grid">
        <label
          >{t('profile.alias')}<input
            bind:value={alias}
            maxlength="80"
            required
          /></label
        ><label
          >{t('profile.current')}<input
            type="number"
            min="1"
            max={data.workspace.curriculum.max_terms}
            bind:value={currentTerm}
            required
          /></label
        ><label
          >{t('profile.last_ips')}<input
            type="number"
            min="0"
            max="4"
            step="0.01"
            placeholder={t('profile.ips_placeholder')}
            value={lastGpa ?? ''}
            onchange={(e) => {
              const value = e.currentTarget.value;
              lastGpa =
                value === ''
                  ? null
                  : Math.max(0, Math.min(4, Math.round(+value * 100) / 100));
            }}
          /></label
        >
      </div>
      {#if data.workspace.curriculum.gpa_credit_rules.length}<p
          class="muted small"
        >
          {t('profile.ips_limits', {
            list: [...data.workspace.curriculum.gpa_credit_rules]
              .sort((a, b) => b.min_gpa - a.min_gpa)
              .map((r) =>
                t('profile.ips_limit_item', {
                  gpa: r.min_gpa.toFixed(2),
                  credits: r.max_credits,
                }),
              )
              .join('; '),
          })}
        </p>{/if}
    </section>
    <section class="panel">
      <div class="section-heading">
        <h2>{t('profile.completed')}</h2>
        <span class="tag"
          >{t('profile.selected', { count: completed.length })}</span
        >
      </div>
      <p class="muted small">{t('profile.completed_hint')}</p>
      <div class="course-checklist">
        {#each data.workspace.curriculum.courses as course}<label
            ><input
              type="checkbox"
              bind:group={completed}
              value={course.code}
            />
            <div>
              <strong>{course.name}</strong><small
                >{t('profile.course_line', {
                  code: course.code,
                  credits: course.credits,
                  term: course.recommended_term,
                  extra:
                    course.category === 'elective'
                      ? t('profile.elective_extra')
                      : '',
                })}</small
              >
            </div></label
          >{/each}
      </div>
    </section>
    {#if error}<p class="error-banner" role="alert">
        {error}
      </p>{/if}{#if notice}<p class="success-banner" role="status">
        {notice}
      </p>{/if}<button class="button primary" disabled={busy}
      >{busy ? t('profile.saving') : t('profile.save')}</button
    >
  </form>{:else}<div class="empty-panel">
    <h2>{t('profile.none')}</h2>
    <a class="button primary" href="/">{t('profile.open_demo')}</a>
  </div>{/if}
