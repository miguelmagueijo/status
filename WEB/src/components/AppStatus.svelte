<script lang="ts">
    import Icon from "@iconify/svelte";
    import {getCleanDateTodayMinusDays} from "../lib/utils";

    interface Props {
        title: string;
        services: string[];
        url?: string;
    }

    const today = new Date();

    const {title, services, url}: Props = $props();
</script>

<div class="p-8 bg-[#132533] rounded border-2 border-[#00b9b9]/25 mt-10">
    <div class="flex gap-2 justify-between items-center">
        <h2 class="text-2xl font-bold">
            {title}
        </h2>
        {#if url}
            <a href="{url}" class="text-sm flex gap-0.5 hover:underline opacity-25" target="_blank">
                <span>Take me there</span>
                <Icon icon="mingcute:arrow-right-up-fill"/>
            </a>
        {/if}
    </div>
    {#each services as service}
        <div class="mt-4">
            <h3 class="text-[#00b9b9] font-bold text-lg flex gap-1.5 items-center">
                <div class="size-4 rounded-full bg-green-500" title="Last check 5min ago"></div> {service}
            </h3>
            <div class="p-4 rounded bg-[#204059] mt-2 h-12 items-center gap-1.5 justify-center grid grid-cols-12">
                {#each {length: 12} as _, i}
                    <div id="hour-{i}" class="bg-white/50 w-full h-full rounded" title="{Math.abs(12 - i)}hrs ago"></div>
                {/each}
            </div>
            <div class="p-4 rounded bg-[#204059] mt-2 h-12 items-center gap-1.5 justify-center grid grid-cols-45">
                {#each {length: 45} as _, i}
                    <span class="block h-full w-full rounded bg-white/50" title={getCleanDateTodayMinusDays(Math.abs(45 - i))}></span>
                {/each}
            </div>
            <div class="flex items-center justify-between mt-1">
                <div>
                    <span class="text-xs">Uptime:</span> <span class="font-semibold">99%</span>
                </div>
                <div>
                    <span class="text-xs">Current status:</span> <span class="text-green-500 font-semibold" title="Last check 5min ago">ALIVE</span>
                </div>
            </div>
        </div>
    {/each}
</div>