<script lang="ts">
  import type { NodeProps } from '@xyflow/svelte';
  import { useI18n } from '#lib/i18n/context.js';
  let { data }: NodeProps = $props();
  const { t } = useI18n();
  type HoursSummary = {
    course: string;
    goal: string;
    total: string;
    available: string;
    hasGoals: boolean;
    over: boolean;
  };
  let hours = $derived((data.hours as HoursSummary | null | undefined) ?? null);
</script>

<div class="semester-node">
  <strong>{t('common.semester', { term: String(data.term) })}</strong><span
    >{t('node.semester_credits', {
      credits: String(data.credits),
      cap: String(data.cap),
    })}</span
  >{#if hours}<small class="semester-hours" class:load-over={hours.over}
      >{hours.hasGoals
        ? t('node.semester_hours_split', {
            total: hours.total,
            available: hours.available,
            course: hours.course,
            goal: hours.goal,
          })
        : t('node.semester_hours', {
            total: hours.total,
            available: hours.available,
          })}</small
    >{/if}
</div>
