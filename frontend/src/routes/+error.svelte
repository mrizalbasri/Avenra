<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head><title>Avenra | Workspace unavailable</title></svelte:head>
<section class="empty-panel">
  <h1>
    {page.status === 404
      ? 'That page is not available.'
      : 'We could not open this workspace.'}
  </h1>
  <p>
    {page.error?.message ??
      'Check the API and database connection, then try again.'}
  </p>
  <a href="/" class="button primary">Return to overview</a>
</section>
