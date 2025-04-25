<script lang="ts">
    import Icon from "@iconify/svelte";

    interface Props {
        boldText: string;
        lowerText: string;
    }

    const {boldText, lowerText}: Props = $props();
</script>

<div class="mx-auto bg-stadarkblue p-10 text-red-400 text-center rounded border-2 border-stablue/25 mt-10">
    <Icon icon="material-symbols:error" class="mx-auto size-16 mb-4"/>
    <p class="text-lg">
        <b>{@html boldText}</b>
    </p>
    <p>
        {lowerText}
    </p>
</div>