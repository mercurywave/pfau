
export type Nil = null | undefined;

export namespace util {

    export function ellipsize(text: string, maxLength: number) {
        if (text.length > maxLength) {
            return text.slice(0, maxLength - 3) + "...";
        }
        return text;
    }

    export function appendPiece(text: string, delim: string, append: string): string {
        if (text == "") return append;
        return text + delim + append;
    }

    export function replaceAll(text: string, search: string, replace: string): string {
        return text.replace(new RegExp(search, 'g'), replace);
    }

    export function deepCopy(obj: any): any {
        return JSON.parse(JSON.stringify(obj));
    }

    export function UUID(): string {
        // only available in HTTPS
        if (typeof crypto?.randomUUID === 'function')
            return crypto.randomUUID();

        // you're not banking with this - it's fine
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    export function isGUID(baseName: string) {
        return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(baseName);
    }

    export function appendPathToUrl(base: string, segment: string): URL {
        const url = new URL(base);
        if (segment.startsWith('/')) segment = segment.substring(1);
        // Ensure no double slashes or missing slashes
        url.pathname = `${url.pathname.replace(/\/$/, '')}/${segment}`;
        return url;
    }


    export function zValidDate(val?: string): boolean {
        return !isNaN(Date.parse(val ?? ''));
    }

    export function parseDate(str?: string) {
        let num = Date.parse(str as string ?? "");
        return new Date(isNaN(num) ? 0 : num);
    }

    export function assetPng(path: string): URL {
        let base = new URL(window.location.href);
        return new URL(`./${path}.png`, base);
    }

    export function quickPick<T>(...items: T[]): T {
        if (items.length === 0) throw new Error("At least one item must be provided");
        let idx = Math.floor(Math.random() * items.length);
        return items[idx] as T;
    }

    export function shuffle<T>(arr:T[]){
        //in-place shuffle this array
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j]!, arr[i]!];
        }
        return arr;
    }
}


export class Broadcaster<T> {
    private _listeners: ((e: T) => void)[] = [];

    public hook(callback: (e: T) => void) {
        this._listeners.push(callback);
    }

    public trigger(ev: T) {
        for (const callback of [...this._listeners]) {
            callback(ev);
        }
    }
}