<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import type { Course } from '#lib/types.js';
  let { data }: NodeProps = $props();
  let course = $derived(data.course as Course);
</script>

<div
  class="course-node"
  class:has-finding={!!data.hasFinding}
  class:failed={!!data.failed}
>
  <Handle type="target" position={Position.Left} isConnectable={false} />
  <div class="course-node-meta">
    <span>{course.code}</span><span>{course.credits} cr</span>
  </div>
  <strong>{course.name}</strong>
  <small
    >{data.failed
      ? 'Retake in this scenario'
      : data.hasFinding
        ? 'Review prerequisites'
        : 'Planned course'}</small
  >
  <Handle type="source" position={Position.Right} isConnectable={false} />
</div>
