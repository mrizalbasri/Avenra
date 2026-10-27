<script lang="ts">
  import Icon from '#lib/components/Icon.svelte';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<svelte:head
  ><title>Avenra | Decision Passport | {data.plan.name}</title></svelte:head
>
<div class="page-heading no-print">
  <div>
    <h1>Take the conversation forward.</h1>
    <p>
      A saved plan snapshot for an informed discussion with your academic
      advisor.
    </p>
  </div>
  <button class="button primary" onclick={() => window.print()}
    ><Icon name="print" size={17} />Print / Save as PDF</button
  >
</div>
<article class="passport">
  <div class="passport-header">
    <span>AVENRA</span><span
      >{data.curriculum.status === 'synthetic'
        ? 'SYNTHETIC DEMO'
        : 'USER-SUPPLIED CURRICULUM'} | ADVISOR CONSULTATION</span
    >
  </div>
  <h1>Academic Decision Passport</h1>
  <h2>{data.plan.name}</h2>
  <dl class="passport-meta">
    <div>
      <dt>Student alias</dt>
      <dd>{data.profile.alias}</dd>
    </div>
    <div>
      <dt>Snapshot</dt>
      <dd>
        Plan revision {data.plan.revision} | Profile revision {data.profile
          .revision}
      </dd>
    </div>
    <div>
      <dt>Curriculum</dt>
      <dd>{data.curriculum.name} | {data.curriculum.version}</dd>
    </div>
    <div>
      <dt>Generated</dt>
      <dd>
        {new Date(data.generatedAt).toLocaleString('en-GB', {
          timeZone: 'Asia/Jakarta',
        })} WIB
      </dd>
    </div>
  </dl>
  <section>
    <h2>Decision summary</h2>
    <p>
      {data.plan.validation.findings.length
        ? `${data.plan.validation.findings.length} rule findings require review.`
        : 'The saved plan satisfies the modeled modeled rules under the listed assumptions.'}
    </p>
    <p>
      Remaining credits: {data.plan.validation.remaining_credits} | Peak load: {data
        .plan.validation.peak_credits} | Modeled completion: {data.plan
        .validation.completion_term
        ? `semester ${data.plan.validation.completion_term}`
        : 'unresolved'}
    </p>
    <p>Scenario setbacks: {data.plan.failed.join(', ') || 'None'}.</p>
  </section>
  <section>
    <h2>Proposed semester plan</h2>
    <table>
      <thead><tr><th>Semester</th><th>Courses</th><th>Credits</th></tr></thead
      ><tbody
        >{#each Object.entries(data.plan.validation.loads) as [term, credits]}<tr
            ><td>{term}</td><td
              >{data.curriculum.courses
                .filter(
                  (c) =>
                    data.plan.assignments[c.code] === +term &&
                    (!data.profile.completed.includes(c.code) ||
                      data.plan.failed.includes(c.code)),
                )
                .map((c) => `${c.code} ${c.name}`)
                .join('; ') || 'No courses scheduled'}</td
            ><td>{credits}</td></tr
          >{/each}</tbody
      >
    </table>
  </section>
  <section>
    <h2>Rule findings</h2>
    {#if data.plan.validation.findings.length}<ul>
        {#each data.plan.validation.findings as finding}<li>
            <strong>{finding.rule.replaceAll('_', ' ')}:</strong>
            {finding.message}
          </li>{/each}
      </ul>{:else}<p>No modeled violations in this saved snapshot.</p>{/if}
  </section>
  <section>
    <h2>Questions for an academic advisor</h2>
    <ol>
      <li>
        Are the prerequisite rules and course offerings accurate for my
        curriculum year?
      </li>
      <li>
        Are there exceptions, equivalent courses, or credit limits this
        simulation does not cover?
      </li>
      <li>
        Which option best fits my academic commitments and intended completion
        date?
      </li>
    </ol>
  </section>
  <section>
    <h2>Sources, assumptions, and limits</h2>
    {#each data.plan.validation.assumptions as assumption}<p>
        {assumption}
      </p>{/each}
    <p>
      Source: {data.curriculum.source} | {data.curriculum.version}. Completed
      courses: {data.profile.completed.join(', ') || 'None'}. This is a planning
      aid, not enrollment authorization or a graduation determination.
    </p>
  </section>
</article>
