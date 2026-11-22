<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { useI18n } from '#lib/i18n/context.js';
  import type { Course } from '#lib/types.js';
  let { data }: NodeProps = $props();
  const { t } = useI18n();
  let course = $derived(data.course as Course);
</script>

<div
  class="course-node"
  class:has-finding={!!data.hasFinding}
  class:failed={!!data.failed}
>
  <Handle type="target" position={Position.Left} isConnectable={false} />
  <div class="course-node-meta">
    <span>{course.code}</span><span
      >{course.category === 'elective' ? t('node.elective') : ''}{t(
        'node.credits_short',
        { count: course.credits },
      )}</span
    >
  </div>
  <strong>{course.name}</strong>
  <small
    >{data.failed
      ? t('node.retake')
      : data.hasFinding
        ? t('node.review')
        : t('node.planned')}</small
  >
  <Handle type="source" position={Position.Right} isConnectable={false} />
</div>
