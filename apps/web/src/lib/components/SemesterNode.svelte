<script lang="ts">
  import type { NodeProps } from '@xyflow/svelte';
  let { data }: NodeProps = $props();
</script>

<div class="semester-node">
  <strong>Semester {String(data.term)}</strong><span
    >{String(data.credits)} / {String(data.cap)} credits</span
  >
</div>
