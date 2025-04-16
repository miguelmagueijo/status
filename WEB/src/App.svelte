<script lang="ts">
  import "./app.css";
  import MmStatusLogo from "./assets/mm_status.svelte";
  import StatusTitle from "./assets/status_title.svelte";
  import Icon from "@iconify/svelte";
</script>

<nav class="py-8 bg-[#132533] border-b-2 border-[#5cff5c]/25">
    <div class="w-1/2 mx-auto flex items-center justify-between">
        <button type="button" class="flex items-center cursor-pointer" onclick={() => window.location.reload()}>
            <MmStatusLogo classes="w-14"/>
            <StatusTitle classes="w-26 ml-4"/>
        </button>
        <div>
            <a href="https://miguelmagueijo.pt" target="_blank" class="flex items-center text-[#ffbd72] gap-1 border-2 border-[#ffbd72] py-1 px-3 rounded font-bold duration-300 hover:text-[#1a1313] hover:bg-[#ffbd72]">
                <span>Home</span>
                <Icon icon="mingcute:arrow-right-up-fill"/>
            </a>
        </div>
    </div>
</nav>
<main class="my-12 text-white w-1/2 mx-auto">
    <h1 class="font-bold text-4xl text-[#5cff5c]">
        Service status
    </h1>
    <div class="p-8 bg-[#132533] rounded border-2 border-[#00b9b9]/25 mt-10">
        <h2 class="text-2xl font-bold">
            Crop Recommendation
        </h2>
        <div class="mt-4">
            <h3 class="text-[#00b9b9] font-semibold">
                WEB
            </h3>
            <div class="p-4 rounded bg-[#204059] mt-2 h-12 flex items-center gap-1.5">
                {#each {length: 72} as _, i}
                    <span class="block h-5 w-[6px] rounded bg-white/50" title={"Time: " + i}></span>
                {/each}
            </div>
            <div class="flex items-center justify-between mt-1">
                <div>
                    <span class="text-xs">Uptime:</span> 99%
                </div>
                <div>
                    <span class="text-xs">Current status:</span> <span class="text-green-500 font-semibold">ALIVE</span>
                </div>
            </div>
        </div>
        <div class="mt-4">
            <h3 class="text-[#00b9b9] font-semibold">
                API
            </h3>
            <div>
                <div class="p-4 rounded bg-[#204059] mt-2 h-12 flex items-center gap-1.5">
                    {#each {length: 72} as _, i}
                        <span class="block h-5 w-[6px] rounded bg-white/50" title={"Time: " + i}></span>
                    {/each}
                </div>
                <div class="flex items-center justify-between mt-1">
                    <div>
                        <span class="text-xs">Uptime:</span> <span class="text-red-500">48%</span>
                    </div>
                    <div>
                        <span class="text-xs">Current status:</span> <span class="text-red-500 font-semibold">DOWN</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="p-8 bg-[#132533] rounded border-2 border-[#00b9b9]/25 mt-10">
        <h2 class="text-2xl font-bold">
            Crop Recommendation
        </h2>
        <div class="mt-4">
            <h3 class="text-[#00b9b9] font-semibold">
                Web
            </h3>
            <div class="p-4 rounded bg-[#204059] mt-2 h-12 flex items-center gap-1.5">
                {#each {length: 72} as _, i}
                    <span class="block h-5 w-[6px] rounded bg-white/50" title={"Time: " + i}></span>
                {/each}
            </div>
            <div class="flex items-center justify-between mt-1">
                <div>
                    <span class="text-xs">Uptime:</span> 99%
                </div>
                <div>
                    <span class="text-xs">Status:</span> <span class="text-green-500 font-semibold">ALIVE</span>
                </div>
            </div>
        </div>
        <div class="mt-4">
            <h3 class="text-[#00b9b9] font-semibold">
                API
            </h3>
            <div>
                <div class="p-4 rounded bg-[#204059] mt-2 h-12 flex items-center gap-1.5">
                    {#each {length: 72} as _, i}
                        <span class="block h-5 w-[6px] rounded bg-white/50" title={"Time: " + i}></span>
                    {/each}
                </div>
                <div class="flex items-center justify-between mt-1">
                    <div>
                        <span class="text-xs">Uptime:</span> <span class="text-red-500">48%</span>
                    </div>
                    <div>
                        <span class="text-xs">Status:</span> <span class="text-red-500 font-semibold">DOWN</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>
<footer class="bg-[#132533] text-white py-8 mt-auto border-t-2 border-[#5cff5c]/25">
    <div class="w-1/2 mx-auto grid grid-cols-3 items-center">
        <div class="flex items-center gap-2 text-sm">
            <MmStatusLogo classes="w-6"/>
            <p>
                Miguel Magueijo © {new Date().getFullYear()}
            </p>
        </div>
        <div class="flex justify-center items-center">
            <a href="https://github.com/miguelmagueijo/status" target="_blank">
                <Icon icon="mdi:github" class="size-8"/>
            </a>
        </div>
        <div class="flex justify-end">
            <a href="https://github.com/miguelmagueijo" target="_blank" class="underline text-sm">
                Source code
            </a>
        </div>
    </div>
</footer>
