<script lang="ts">
  import './layout.css';
  import Header from '$lib/components/Header.svelte';
  import { zen } from '$lib/stores/zen.svelte';

  let { children } = $props();
</script>

<div class="min-h-screen flex flex-col font-sans bg-[#FBFBFD] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
  <Header isZenActive={zen.active} />
  <div class="flex-1 flex flex-col">
    {@render children()}
  </div>
</div>
