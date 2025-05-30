<script lang="ts">
    import Icon from "@iconify/svelte";
    import {getCleanDateTodayMinusDays, getLastHoursIntervals} from "../lib/utils";
    import type {AppData, AppServiceResponse, AppServiceStatus} from "../lib/types";
    import {onMount} from "svelte";

    interface Props {
        appKey: string;
        appData: AppData;
        days: number;
    }

    interface JobConfig {
        job: NodeJS.Timeout | null;
        isSuspended: boolean;
    }

    const {appKey, appData, days}: Props = $props();
    const jobs: {[key: string]: JobConfig} = {}
    const redLimit = 60;
    const yellowLimit = 90;
    const refreshSecondsWait = 30;

    function getAppServiceElementId(appKey: string, serviceKey: string, suffix: string) {
        return `${appKey}-${serviceKey}-${suffix}`;
    }

    function resetAppServiceStatusVisuals(appKey: string, serviceKey: string, classToRemove: string, btnToHide: string) {
        const ballElement = document.getElementById(getAppServiceElementId(appKey, serviceKey, `ball`))!;
        const statusMsgElement = document.getElementById(getAppServiceElementId(appKey, serviceKey, `status`))!;
        const uptimeElement = document.getElementById(getAppServiceElementId(appKey, serviceKey, `uptime`))!;

        ballElement.classList.remove(classToRemove);
        ballElement.title = "";

        statusMsgElement.classList.remove(classToRemove);
        statusMsgElement.title = "";
        statusMsgElement.innerText = "-";

        uptimeElement.classList.remove(classToRemove);
        uptimeElement.title = "";
        uptimeElement.innerText = "-";

        document.getElementById(getAppServiceElementId(appKey, serviceKey, btnToHide))!.classList.add("hidden");
    }

    function statusRecordHandler(prefixID: string, statusRecord: AppServiceStatus) {
        const percentage = statusRecord.total_success / statusRecord.total_checks * 100;
        const element = document.getElementById(prefixID + String(statusRecord.record_id))!;

        if (percentage <= redLimit) {
            element.classList.remove("green");
            element.classList.remove("yellow");
            element.classList.add("red");
        } else if (percentage <= yellowLimit) {
            element.classList.remove("green");
            element.classList.remove("red");
            element.classList.add("yellow");
        } else {
            element.classList.remove("red");
            element.classList.remove("yellow");
            element.classList.add("green");
        }
    }

    function changeAppServiceStatus(appKey: string, serviceKey: string, uptime: number, isAlive: boolean) {
        const ballElement = document.getElementById(getAppServiceElementId(appKey, serviceKey, `ball`))!;
        const statusMsgElement = document.getElementById(getAppServiceElementId(appKey, serviceKey, `status`))!;
        const uptimeElement = document.getElementById(getAppServiceElementId(appKey, serviceKey, `uptime`))!;

        uptimeElement.innerHTML = `${uptime}`;

        ballElement.title = statusMsgElement.title = `Last check made on: ${new Date().toLocaleString("en-UK")}`;
        uptimeElement.title = "Based on the last 45 days";

        if (uptime <= redLimit) {
            uptimeElement.classList.remove("green");
            uptimeElement.classList.remove("yellow");
            uptimeElement.classList.add("red");
        } else if (uptime <= yellowLimit){
            uptimeElement.classList.remove("green");
            uptimeElement.classList.remove("red");
            uptimeElement.classList.add("yellow");
        } else {
            uptimeElement.classList.remove("red");
            uptimeElement.classList.remove("yellow");
            uptimeElement.classList.add("green");
        }

        if (isAlive) {
            ballElement.classList.remove("red");
            ballElement.classList.add("green");
            statusMsgElement.classList.remove("red");
            statusMsgElement.classList.add("green");
            statusMsgElement.innerHTML = "UP";
        } else {
            ballElement.classList.remove("green");
            ballElement.classList.add("red");
            statusMsgElement.classList.remove("green");
            statusMsgElement.classList.add("red");
            statusMsgElement.innerHTML = "DOWN";
        }
    }

    function unsuspendRequests(appKey: string, serviceKey: string) {
        resetAppServiceStatusVisuals(appKey, serviceKey, "purple", "refresh-btn");
        executeRequest(appKey, serviceKey);

        (document.getElementById(getAppServiceElementId(appKey, serviceKey, "refresh-btn"))! as HTMLButtonElement).disabled = true;
        setTimeout(() => {
            (document.getElementById(getAppServiceElementId(appKey, serviceKey, "refresh-btn"))! as HTMLButtonElement).disabled = false;
        }, refreshSecondsWait * 1000);
    }

    function suspendRequests(appKey: string, serviceKey: string) {
        const ballElement = document.getElementById(getAppServiceElementId(appKey, serviceKey, `ball`))!;
        const statusMsgElement = document.getElementById(getAppServiceElementId(appKey, serviceKey, `status`))!;
        const uptimeElement = document.getElementById(getAppServiceElementId(appKey, serviceKey, `uptime`))!;

        ballElement.classList.remove("green");
        ballElement.classList.remove("red");
        ballElement.classList.remove("yellow");
        ballElement.classList.add("purple");
        ballElement.title = "This service is suspended";

        statusMsgElement.classList.remove("green");
        statusMsgElement.classList.remove("red");
        statusMsgElement.classList.remove("yellow");
        statusMsgElement.classList.add("purple");
        statusMsgElement.title = "This service is suspended";
        statusMsgElement.innerText = "SUSPENDED";

        uptimeElement.classList.remove("green");
        uptimeElement.classList.remove("red");
        uptimeElement.classList.remove("yellow");
        uptimeElement.classList.add("purple");
        uptimeElement.title = "This service is suspended";
        uptimeElement.innerText = "SUSPENDED";

        document.getElementById(getAppServiceElementId(appKey, serviceKey, "refresh-btn"))!.classList.remove("hidden");
    }

    async function executeRequest(appKey: string, serviceKey: string) {
        const jobConfig = jobs[`${appKey}-${serviceKey}`];

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/status/${appKey}/${serviceKey}`);

            if (res.status !== 200) {
                throw new Error();
            }

            const resData: AppServiceResponse = await res.json();

            jobConfig.isSuspended = resData.isSuspended;

            const hourID = getAppServiceElementId(appKey, serviceKey, "h");
            for (const hData of resData.hoursData) {
                statusRecordHandler(hourID, hData);
            }

            const dayID = getAppServiceElementId(appKey, serviceKey, "d");
            for (const dData of resData.daysData) {
                statusRecordHandler(dayID, dData);
            }

            changeAppServiceStatus(appKey, serviceKey, resData.uptimePercentage, resData.isAlive);

            if (!jobConfig.isSuspended) {
                jobConfig.job = setTimeout(() => executeRequest(appKey, serviceKey), 310000);
            } else {
                suspendRequests(appKey, serviceKey);
            }
        } catch (e) {
            console.error(e);
            suspendRequests(appKey, serviceKey);
            jobConfig.isSuspended = true;
        }
    }

    onMount(async () => {
        for (const serviceKey of Object.keys(appData.services)) {
            jobs[`${appKey}-${serviceKey}`] = {
                job: null,
                isSuspended: false
            };

            executeRequest(appKey, serviceKey);
        }
    });
</script>

<div class="p-8 bg-stadarkblue rounded border-2 border-stablue/25 mt-10">
    <div class="flex gap-2 justify-between items-center">
        <h2 class="text-2xl font-bold">
            {appData.name}
        </h2>
        {#if appData.url}
            <a href="{appData.url}" class="text-sm flex gap-0.5 hover:underline" target="_blank">
                <span>Take me there</span>
                <Icon icon="mingcute:arrow-right-up-fill"/>
            </a>
        {/if}
    </div>
    {#each Object.entries(appData.services) as [serviceKey, serviceName]}
        <div class="mt-4">
            <h3 class="text-stablue font-bold text-lg flex gap-1.5 items-center">
                <span id={getAppServiceElementId(appKey, serviceKey, "ball")}
                      class="status-ball" title="Last check 5min ago"></span>
                {serviceName}
                <button id={getAppServiceElementId(appKey, serviceKey, "refresh-btn")}
                        type="button"
                        onclick={() => unsuspendRequests(appKey, serviceKey)}
                        class="bg-violet-600 p-1 rounded text-white font-bold cursor-pointer text-xs ml-2 group disabled:pointer-events-none disabled:bg-gray-500 hidden">
                    <Icon icon="ic:round-refresh" class="size-5 group-hover:rotate-180 duration-300"/>
                </button>
            </h3>
            <div class="p-4 rounded bg-stasoftblue mt-2 h-12 items-center gap-1.5 justify-center grid grid-cols-13">
                {#each getLastHoursIntervals(13).reverse() as interval, i}
                    {@const hour = Math.abs(12 - i)}
                    <div id={getAppServiceElementId(appKey, serviceKey, `h${hour}`)} class="time-mark"
                         title={interval}></div>
                {/each}
            </div>
            <div class="flex gap-2 items-center text-xs mt-1 opacity-25">
                <div>
                    12 hours ago
                </div>
                <div class="h-[1px] grow bg-white rounded"></div>
                <div>
                    Current hour
                </div>
            </div>
            <div class="p-4 rounded bg-stasoftblue mt-2 h-12 items-center gap-1.5 justify-center"
                 style="display: grid; grid-template-columns: repeat({days}, minmax(0, 1fr));"
            >
                {#each {length: days} as _, i}
                    {@const day = Math.abs(days - i)}
                    <div id={getAppServiceElementId(appKey, serviceKey, `d${day}`)} class="time-mark"
                         title={getCleanDateTodayMinusDays(day)}></div>
                {/each}
            </div>
            <div class="flex gap-2 items-center text-xs mt-1 opacity-25">
                <div>
                    35 days ago
                </div>
                <div class="h-[1px] grow bg-white rounded"></div>
                <div>
                    Yesterday
                </div>
            </div>
            <div class="flex items-center justify-between mt-1">
                <div>
                    <span class="text-xs">
                        Uptime:
                    </span>
                    <span id={getAppServiceElementId(appKey, serviceKey, "uptime")} class="status-text"
                          title="Based on the last 45 days">-</span>
                    <span class="font-semibold text-xs opacity-50">%</span>
                </div>
                <div>
                    <span class="text-xs">
                        Current status:
                    </span>
                    <span id={getAppServiceElementId(appKey, serviceKey, "status")}
                          class="status-text" title="Last check 5min ago">
                        -
                    </span>
                </div>
            </div>
        </div>
    {/each}
</div>