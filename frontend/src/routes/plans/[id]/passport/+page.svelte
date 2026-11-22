<script lang="ts">
  import Icon from '#lib/components/Icon.svelte';
  import { useI18n } from '#lib/i18n/context.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { t, locale, msg } = useI18n();
  let validation = $derived(data.plan.validation);
  let ipsNote = $derived(
    validation.planning_gpa !== null
      ? t('passport.ips_used', {
          term: data.profile.current_term,
          gpa: validation.planning_gpa.toFixed(2),
        })
      : '',
  );
</script>

<svelte:head
  ><title>{t('passport.title', { name: data.plan.name })}</title></svelte:head
>
<div class="page-heading no-print">
  <div>
    <h1>{t('passport.heading')}</h1>
    <p>{t('passport.lead')}</p>
  </div>
  <button class="button primary" onclick={() => window.print()}
    ><Icon name="print" size={17} />{t('passport.print')}</button
  >
</div>
<article class="passport">
  <div class="passport-header">
    <span>AVENRA</span><span
      >{data.curriculum.status === 'synthetic'
        ? t('passport.brand_synthetic')
        : t('passport.brand_own')}</span
    >
  </div>
  <h1>{t('passport.name')}</h1>
  <h2>{data.plan.name}</h2>
  <dl class="passport-meta">
    <div>
      <dt>{t('passport.alias')}</dt>
      <dd>{data.profile.alias}</dd>
    </div>
    <div>
      <dt>{t('passport.snapshot')}</dt>
      <dd>
        {t('passport.snapshot_value', {
          plan: data.plan.revision,
          profile: data.profile.revision,
        })}
      </dd>
    </div>
    <div>
      <dt>{t('passport.curriculum')}</dt>
      <dd>{data.curriculum.name} | {data.curriculum.version}</dd>
    </div>
    <div>
      <dt>{t('passport.generated')}</dt>
      <dd>
        {new Date(data.generatedAt).toLocaleString(
          locale() === 'id' ? 'id-ID' : 'en-GB',
          { timeZone: 'Asia/Jakarta' },
        )} WIB
      </dd>
    </div>
  </dl>
  <section>
    <h2>{t('passport.summary')}</h2>
    <p>
      {validation.findings.length
        ? t('passport.findings_need', { count: validation.findings.length })
        : t('passport.all_satisfied')}
    </p>
    <p>
      {t('passport.credits', {
        completed: validation.completed_credits,
        planned: validation.planned_credits,
        total: validation.graduation_credits,
        peak: validation.peak_credits,
        completion: validation.completion_term
          ? t('plan.change_semester', { term: validation.completion_term })
          : t('passport.unresolved'),
      })}
    </p>
    <p>
      {t('passport.setbacks', {
        list: data.plan.failed.join(', ') || t('passport.none'),
        ips: ipsNote,
      })}
    </p>
  </section>
  <section>
    <h2>{t('passport.plan')}</h2>
    <table>
      <thead
        ><tr
          ><th>{t('passport.col.semester')}</th><th
            >{t('passport.col.courses')}</th
          ><th>{t('passport.col.credits')}</th><th>{t('passport.col.limit')}</th
          ></tr
        ></thead
      ><tbody
        >{#each Object.entries(validation.loads) as [term, credits]}<tr
            ><td>{term}</td><td
              >{data.curriculum.courses
                .filter(
                  (c) =>
                    data.plan.assignments[c.code] === +term &&
                    (!data.profile.completed.includes(c.code) ||
                      data.plan.failed.includes(c.code)),
                )
                .map((c) => `${c.code} ${c.name}`)
                .join('; ') || t('passport.no_courses')}</td
            ><td>{credits}</td><td>{validation.caps[term]}</td></tr
          >{/each}</tbody
      >
    </table>
  </section>
  {#if data.plan.bottlenecks.length}<section>
      <h2>{t('passport.affected')}</h2>
      <ul>
        {#each data.plan.bottlenecks as blocker}<li>
            {blocker.path.join(' → ')}
          </li>{/each}
      </ul>
    </section>{/if}
  <section>
    <h2>{t('passport.rules')}</h2>
    {#if validation.findings.length}<ul>
        {#each validation.findings as finding}<li>
            <strong>{msg.ruleLabel(finding.rule)}:</strong>
            {msg.describe('finding', finding)}
          </li>{/each}
      </ul>{:else}<p>{t('passport.no_violations')}</p>{/if}
  </section>
  <section>
    <h2>{t('passport.questions')}</h2>
    <ol>
      {#each validation.advisor_items as question}<li>
          {msg.describe('advisor', question)}
        </li>{/each}
    </ol>
  </section>
  <section>
    <h2>{t('passport.sources')}</h2>
    {#each validation.assumption_items as assumption}<p>
        {assumption.code === 'DISCLAIMER'
          ? msg.disclaimer(data.curriculum)
          : msg.describe('assume', assumption)}
      </p>{/each}
    <p>
      {t('passport.source_line', {
        source: data.curriculum.source,
        version: data.curriculum.version,
        completed: data.profile.completed.join(', ') || t('passport.none'),
      })}
    </p>
  </section>
</article>
