<script lang="ts">
  import type { HelpArticle } from "$lib/help/documentation-types";
  import * as Card from "$lib/components/ui/card";
  import MousePointer2 from "@lucide/svelte/icons/mouse-pointer-2";
  import Eye from "@lucide/svelte/icons/eye";
  import Settings2 from "@lucide/svelte/icons/settings-2";
  let { article }: { article: HelpArticle } = $props();
  const icons = [MousePointer2, Eye, Settings2];
  import { chartExampleKind } from "$lib/help/chart-examples";
  import { lazyComponent } from "$lib/utils/lazy-component.svelte";
  const demo = lazyComponent(() => import("./HelpChartExample.svelte"));
  const kind = $derived(chartExampleKind(article.href));
  $effect(() => {
    demo.open = kind !== null;
  });
</script>

{#if article.reading?.length}
  <section class="space-y-4" aria-label="Page reading aid">
    <h2 class="font-semibold">How to read this page</h2>
    {#if kind && demo.component}
      {#key article.href}
        <demo.component {kind} />
      {/key}
    {/if}
    <div class="grid gap-3 sm:grid-cols-3">
      {#each article.reading as step, i (step.title)}
        {@const Icon = icons[i % icons.length]}
        <Card.Root variant="default">
          <Card.Header class="space-y-2 p-4 pb-2">
            <span
              class="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Icon class="size-4" />
            </span>
            <Card.Title class="text-sm">{i + 1}. {step.title}</Card.Title>
          </Card.Header>
          <Card.Content variant="muted" class="p-4 pt-0">
            <p class="text-sm leading-relaxed">
              {step.text}
            </p>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </section>
{/if}
