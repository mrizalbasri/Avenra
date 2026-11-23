<script lang="ts">
  let { name, size = 20 }: { name: string; size?: number } = $props();
  const paths: Record<string, string> = {
    home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
    plans: 'M4 4h6v16H4zM14 4h6v10h-6zM14 18h6',
    compare: 'M8 3v18m8-18v18M3 8l5-5 5 5m-2 8 5 5 5-5',
    study:
      'M12 6c-3-3-7-3-10-2v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15',
    profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 0 1 16 0',
    info: 'M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    plus: 'M12 5v14M5 12h14',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    check: 'm5 12 4 4L19 6',
    clock: 'M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    copy: 'M8 8h13v13H8zM16 8V3H3v13h5',
    alert: 'm12 3 10 18H2Zm0 6v5m0 3v.1',
    print: 'M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6z',
    close: 'M6 6l12 12M18 6 6 18',
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"><path d={paths[name] ?? paths.info} /></svg
>
