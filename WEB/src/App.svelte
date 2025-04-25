<script lang="ts">
    import "./app.css";
    import MmStatusLogo from "./assets/mm_status.svelte";
    import StatusTitle from "./assets/status_title.svelte";
    import Icon from "@iconify/svelte";
    import AppStatus from "./components/AppStatus.svelte";
    import {onMount} from "svelte";
    import type {AppConfig} from "./lib/types";
    import ErrorMsg from "./components/ErrorMsg.svelte";

    const currentYear = new Date().getFullYear();
    const ccYear = __RELEASE_YEAR__ === currentYear ? __RELEASE_YEAR__ : `${__RELEASE_YEAR__}-${currentYear}`;

    let isLoading = true;
    let isApiError = false;
    let appConfig: AppConfig | null = null;
    let updateDatetimeJob: NodeJS.Timeout | undefined = undefined;

    function updateDatetimes() {
        document.getElementById("utc-datetime")!.innerText = new Date().toLocaleString("en-UK", {timeZone: "utc"}).slice(0, -3);
        document.getElementById("client-datetime")!.innerText = new Date().toLocaleString("en-UK").slice(0, -3);
    }

    onMount(async () => {
        updateDatetimes();
        updateDatetimeJob = setInterval(updateDatetimes, 60000);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/apps-and-services`);

            if (res.status !== 200) {
                throw new Error();
            }

            appConfig = await res.json();
            isApiError = false;
        } catch (e) {
            console.error(e);
            isApiError = true;
        } finally {
            isLoading = false;
        }
    });
</script>

<nav class="py-8 bg-stadarkblue border-b-2 border-stagreen/25">
    <div class="w-[850px] mx-auto flex items-center justify-between">
        <button type="button" class="flex items-center cursor-pointer" onclick={() => window.location.reload()}>
            <MmStatusLogo classes="w-14"/>
            <StatusTitle classes="w-26 ml-4"/>
        </button>
        <div>
            <a href="https://miguelmagueijo.pt" target="_blank" class="flex items-center text-homcaramel gap-1 border-2 border-homcaramel py-1 px-3 rounded font-bold duration-300 hover:text-hombrown hover:bg-homcaramel">
                <span>Home</span>
                <Icon icon="mingcute:arrow-right-up-fill"/>
            </a>
        </div>
    </div>
</nav>
<main class="my-12 text-white w-[850px] mx-auto">
    <h1 class="font-bold text-4xl text-stagreen text-center">
        APPS & SERVICES STATUS
    </h1>
    <p class="text-center opacity-50">
        Times shown in this page are in UTC timezone
    </p>
    <div class="text-center opacity-50 flex mx-auto w-fit">
        <div>
            UTC
            <br/>
            <span id="utc-datetime"></span>
        </div>
        <div class="w-0.5 rounded h-4 my-auto bg-white mx-6"></div>
        <div>
            Yours
            <br/>
            <span id="client-datetime"></span>
        </div>
    </div>
    {#if isApiError}
        <ErrorMsg boldText="HA!<br/>This is funny, it seems like the API is unavailable."
                  lowerText="Please contact the administrator." />
    {:else}
        {#if isLoading}
            <div class="text-center mt-20">
                <Icon icon="mingcute:loading-fill" class="text-stablue size-16 mx-auto animate-spin"/>
                <p class="mt-4 text-xl text-stablue font-bold">
                    Loading...
                </p>
            </div>
        {:else}
            {#if appConfig}
                {#each Object.entries(appConfig.map) as [appKey, appData]}
                    <AppStatus {appKey} {appData} days={appConfig.days}/>
                {/each}
            {:else}
                <ErrorMsg boldText="Oops, seems like I couldn't build the page..."
                          lowerText="Please contact the administrator." />
            {/if}
        {/if}
    {/if}
</main>
<footer class="bg-stadarkblue text-white py-8 mt-auto border-t-2 border-stagreen/25">
    <div class="w-[850px] mx-auto grid grid-cols-3 items-center">
        <div class="flex items-center gap-2 text-sm">
            <MmStatusLogo classes="w-6"/>
            <p>
                Miguel Magueijo © {ccYear}
            </p>
        </div>
        <div class="flex justify-center items-center">
            <a href="https://github.com/miguelmagueijo" target="_blank">
                <Icon icon="mdi:github" class="size-8"/>
            </a>
        </div>
        <div class="flex justify-end">
            <a href="https://github.com/miguelmagueijo/status" target="_blank" class="underline text-sm">
                Source code
            </a>
        </div>
    </div>
    <div class="w-[850px] mx-auto text-xs opacity-20">
        WEB {__PACKAGE_VERSION__} {#if appConfig}| API {appConfig.version}{/if}
    </div>
</footer>
