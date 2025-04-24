export interface ServicesData {
    [key: string]: string
}

export interface AppData {
    name: string;
    visit_url: string | null,
    services: Array<ServicesData>
}

export interface AppsMap {
    [key: string]: AppData
}

export interface AppConfig {
    map: AppsMap;
    version: string;
    days: number;
}