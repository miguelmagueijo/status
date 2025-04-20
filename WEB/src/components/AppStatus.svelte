<script lang="ts">
    import Icon from "@iconify/svelte";

    interface Props {
        title: string;
        services: string[];
        url?: string;
    }

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
            <h3 class="text-[#00b9b9] font-bold text-lg">
                {service}
            </h3>
            <div class="p-4 rounded bg-[#204059] mt-2 h-12 flex items-center gap-1.5 justify-center">
                {#each {length: 48} as _, i}
                    <span class="block h-5 w-[10px] rounded bg-white/50" title={"Time: " + i}></span>
                {/each}
            </div>
            <div class="flex items-center justify-between mt-1">
                <div>
                    <span class="text-xs">Uptime:</span> <span class="font-semibold">99%</span>
                </div>
                <div>
                    <span class="text-xs">Current status:</span> <span class="text-green-500 font-semibold">ALIVE</span>
                </div>
            </div>
        </div>
    {/each}
</div>