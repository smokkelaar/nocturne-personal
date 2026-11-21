<script lang="ts">
  import { plural } from "#lib/utils/plural.js";
  import type { TreatmentFood } from "#lib/api/index.js";

  interface Props {
    food: TreatmentFood;
    class?: string;
  }

  let { food, class: className = "" }: Props = $props();

  const details = $derived.by(() => {
    const parts: string[] = [];

    // Only show portions if > 0
    if (food.portions) {
      parts.push(plural(food.portions, ["# portion", "# portions"]));
    }

    // Always show carbs
    parts.push(`${food.carbs}g carbs`);

    // Show time offset if present
    if (food.timeOffsetMinutes) {
      parts.push(`+${food.timeOffsetMinutes} min`);
    }

    // Show note if present
    if (food.note) {
      parts.push(food.note);
    }

    return parts.join(" • ");
  });
</script>

<span class={className}>{details}</span>
