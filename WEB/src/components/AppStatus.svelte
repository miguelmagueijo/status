<script lang="ts">
    import Icon from "@iconify/svelte";
    import {getCleanDateTodayMinusDays} from "../lib/utils";
    import type {AppData} from "../lib/types";

    interface Props {
        appKey: string;
        appData: AppData;
        days: number;
    }

    const {appKey, appData, days}: Props = $props();
</script>

<div class="p-8 bg-stadarkblue rounded border-2 border-stablue/25 mt-10">
    <div class="flex gap-2 justify-between items-center">
        <h2 class="text-2xl font-bold">
            {appData.name}
        </h2>
        {#if appData.visit_url}
            <a href="{appData.visit_url}" class="text-sm flex gap-0.5 hover:underline opacity-25" target="_blank">
                <span>Take me there</span>
                <Icon icon="mingcute:arrow-right-up-fill"/>
            </a>
        {/if}
    </div>
    {#each Object.entries(appData.services) as [serviceKey, serviceName]}
        <div class="mt-4">
            <h3 class="text-stablue font-bold text-lg flex gap-1.5 items-center">
                <div class="size-4 rounded-full bg-green-500" title="Last check 5min ago"></div> {serviceName}
            </h3>
            <div class="p-4 rounded bg-stasoftblue mt-2 h-12 items-center gap-1.5 justify-center grid grid-cols-12">
                {#each {length: 12} as _, i}
                    {@const hour = Math.abs(12 - i)}
                    <div id="{appKey}-{serviceKey}-h{i}" class="time-mark"
                         title="{hour}hr{hour > 1 ? 's' : ''} ago"></div>
                {/each}
            </div>
            <div class="p-4 rounded bg-stasoftblue mt-2 h-12 items-center gap-1.5 justify-center"
                 style="display: grid; grid-template-columns: repeat({days}, minmax(0, 1fr));"
            >
                {#each {length: days} as _, i}
                    <div id="{appKey}-{serviceKey}-d{i}" class="time-mark"
                         title={getCleanDateTodayMinusDays(Math.abs(days - i))}></div>
                {/each}
            </div>
            <div class="flex items-center justify-between mt-1">
                <div>
                    <span class="text-xs">
                        Uptime:
                    </span>
                    <span class="font-semibold">
                        99%
                    </span>
                </div>
                <div>
                    <span class="text-xs">
                        Current status:
                    </span>
                    <span class="text-green-500 font-semibold" title="Last check 5min ago">
                        ALIVE
                    </span>
                </div>
            </div>
        </div>
    {/each}
</div>

<style lang="postcss">
    @import "../app.css";

    .time-mark {
        @apply rounded bg-white/50;
        height: 100%;
    }
</style>