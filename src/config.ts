import { Flow } from "./flow";


const SETTING_PATH = 'pfau-settings';

interface ISettings {
    v: number;
    llmServers: ILlmServer[];
    llmModels: string[];
}

export interface ILlmServer {
    id: string;
    type: string;
    url?: string;
    alias?: string;
}

export interface IService {
    name: string;
    key?: string;
    description?: string;
}

let _config: ISettings;

export namespace Config {

    export async function LoadSettings(): Promise<void> {
        let str = window.localStorage.getItem(SETTING_PATH);
        if (str) try {
            _config = JSON.parse(str);
            CleanSettings();
        } catch { ResetSettings(); }
        else ResetSettings();
    }
    export function Save() {
        window.localStorage.setItem(SETTING_PATH, JSON.stringify(_config));
        Flow.Dirty();
    }


    export function getllmServers(): ILlmServer[] { return _config.llmServers; }
    export function setllmServers(servers: ILlmServer[]) { _config.llmServers = servers; }


    export let llmPipelines: IService[] = [
        {
            name: "OpenAI",
            key: "OpenAI",
            description: `
                Open AI frontend API
            `.trim(),
        },
        {
            name: "Ollama",
            key: "Ollama",
            description: `
                Ollama server. You may need to consider CORS to enable access
            `.trim(),
        },
    ];
}

function CleanSettings() {
}

function ResetSettings() {
    _config = {
        v: 1,
        llmServers: [],
        llmModels: [],
    };
}