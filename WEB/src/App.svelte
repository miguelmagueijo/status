<script lang="ts">
  import "./app.css";
  import MmStatusLogo from "./assets/mm_status.svelte";
  import StatusTitle from "./assets/status_title.svelte";
  import Icon from "@iconify/svelte";
  import AppStatus from "./components/AppStatus.svelte";

  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const ccYear = startYear === currentYear ? startYear : `${startYear}-${currentYear}`;
</script>

<nav class="py-8 bg-[#132533] border-b-2 border-[#5cff5c]/25">
    <div class="w-[850px] mx-auto flex items-center justify-between">
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
<main class="my-12 text-white w-[850px] mx-auto">
    <h1 class="font-bold text-4xl text-[#5cff5c]">
        APPS & SERVICES STATUS
    </h1>
    <AppStatus title="Portfolio / Website" services={["WEB"]} url={"https://miguelmagueijo.pt"}/>
    <AppStatus title="Crop Recommendation" services={["WEB", "API"]} url={"https://cr.miguelmagueijo.pt"}/>
</main>
<footer class="bg-[#132533] text-white py-8 mt-auto border-t-2 border-[#5cff5c]/25">
    <div class="w-[850px] mx-auto grid grid-cols-3 items-center">
        <div class="flex items-center gap-2 text-sm">
            <MmStatusLogo classes="w-6"/>
            <p>
                Miguel Magueijo © {ccYear}
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
