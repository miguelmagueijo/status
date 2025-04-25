export interface ServicesData {
    [key: string]: string
}

export interface AppData {
    name: string;
    url: string | null,
    services: ServicesData
}

export interface AppsMap {
    [key: string]: AppData
}

export interface AppConfig {
    map: AppsMap;
    version: string;
    days: number;
}

export interface AppServiceStatus {
    date_id: string;
    record_id: number;
    total_checks: number;
    total_success: number;
    total_fail: number;
}

export interface AppServiceResponse {
    message: string;
    isAlive: boolean;
    isSuspended: boolean;
    hoursData: Array<AppServiceStatus>;
    daysData: Array<AppServiceStatus>;
    uptimePercentage: number;
}