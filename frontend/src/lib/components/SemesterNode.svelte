<script lang="ts">
  import type { NodeProps } from '@xyflow/svelte';
  import { useI18n } from '#lib/i18n/context.js';
  let { data }: NodeProps = $props();
  const { t } = useI18n();
</script>

<div class="semester-node">
  <strong>{t('common.semester', { term: String(data.term) })}</strong><span
    >{t('node.semester_credits', {
      credits: String(data.credits),
      cap: String(data.cap),
    })}</span
  >
</div>
