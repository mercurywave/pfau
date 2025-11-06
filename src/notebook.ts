import { AILink } from "./ai";
import { Config } from "./config";
import { DB } from "./DB";
import { Flow } from "./flow";
import { Interpreter } from "./hefe/interpreter";
import { Parser } from "./hefe/parser";
import { Stream } from "./hefe/stream";
import { util } from "./util";

export class Notebook {
    public blocks: Block[] = []; // Don't modify directly - this needs to sync with meta
    public _meta: NotebookMeta;
    private _permanent: boolean = false;
    public constructor(meta: NotebookMeta) {
        this._meta = meta;
        this.blocks = meta.blocks.map(obj => new Block(this, obj));
        this._permanent = !!this._meta.name;
    }

    public FlagDirty(): void {
        Flow.Dirty();
        if (!this._permanent) return;
        DB.SaveNotebook(this);
    }

    public get id(): string { return this._meta.id; }
    public get isDeleted(): boolean { return this._meta.isDeleted ?? false; }
    public get name(): string { return this._meta.name ?? ""; }
    public set name(val: string) {
        if (val != "") this._meta.name = val;
        else delete this._meta.name;
        this._permanent = !!this._meta.name;
        this.FlagDirty();
    }

    public createBlock(idx?: number): Block {
        let meta = { type: eBlock.Unknown, id: util.UUID() };
        let block = new Block(this, meta);
        this.insertBlock(block, idx);
        return block;
    }

    public insertBlock(block: Block, idx?: number): Block {
        if (idx !== undefined && idx >= 0 && idx < this.blocks.length) {
            this.blocks.splice(idx, 0, block);
            this._meta.blocks.splice(idx, 0, block._meta);
        } else {
            this.blocks.push(block);
            this._meta.blocks.push(block._meta);
        }
        this.FlagDirty();
        return block;
    }

    public deleteBlock(block: Block) {
        let idx = this.blocks.indexOf(block);
        this.blocks.splice(idx, 1);
        this._meta.blocks.splice(idx, 1);
        this.FlagDirty();
    }

    public getInputStreamAt(block: Block): Stream {
        let idx = this.blocks.indexOf(block) - 1;
        for (; idx >= 0; idx--) {
            let bk = this.blocks[idx]!;
            if (bk.type == eBlock.Region) break;
            let out = bk.output;
            if (out != null) return out;
        }
        return Stream.mkText("");
    }
}

export class Block {
    public notebook: Notebook;
    public _meta: BlockMeta;
    public _output: Stream | null = null;
    private _dirtyCalc: boolean = true;
    public constructor(nb: Notebook, meta: BlockMeta) {
        this.notebook = nb;
        this._meta = meta;
    }
    public FlagDirty(): void {
        this.notebook.FlagDirty();
    }
    public get type(): eBlock { return this._meta.type; }
    public set type(val: eBlock) {
        if (this.type == val) return;
        this._meta.type = val;
        // Should I clear data?
        this.FlagDirty();
    }
    public get id(): string { return this._meta.id; }
    public get data(): string { return this._meta.data ?? ""; }
    public set data(val: string | undefined) {
        if (this.data == val) return;
        this._meta.data = val;
        if (this.hasCode) this._dirtyCalc = true;
        this.FlagDirty();
    }
    public get autoExec(): boolean { return this._meta.autoExec ?? false; }
    public set autoExec(val: boolean) {
        if ((this.autoExec ?? false) == val) return;
        if (val) this._meta.autoExec = val;
        else delete this._meta.autoExec;
        this.FlagDirty();
    }
    public get expandSettings(): boolean { return this._meta.expandSettings ?? false; }
    public set expandSettings(val: boolean) {
        if ((this.expandSettings ?? false) == val) return;
        if (val) this._meta.expandSettings = val;
        else delete this._meta.expandSettings;
        this.FlagDirty();
    }
    public get expandOutput(): boolean { return this._meta.expandOutput ?? false; }
    public set expandOutput(val: boolean) {
        if ((this.expandOutput ?? false) == val) return;
        if (val) this._meta.expandOutput = val;
        else delete this._meta.expandOutput;
        this.FlagDirty();
    }
    public get retainData(): boolean { return this._meta.retainData ?? false; }
    public set retainData(val: boolean) {
        if ((this.retainData ?? false) == val) return;
        if (val) this._meta.retainData = val;
        else delete this._meta.retainData;
        this.FlagDirty();
    }

    public get aiServerKey(): string { return this._meta.aiServerKey ?? ""; }
    public set aiServerKey(val: string | undefined) {
        if (this.aiServerKey == val) return;
        this._meta.aiServerKey = val;
        if (this.hasCode) this._dirtyCalc = true;
        this.FlagDirty();
    }

    public get aiModel(): string { return this._meta.aiModel ?? ""; }
    public set aiModel(val: string | undefined) {
        if (this.aiModel == val) return;
        this._meta.aiModel = val;
        if (this.hasCode) this._dirtyCalc = true;
        this.FlagDirty();
    }

    public get hasCode(): boolean {
        return this.type === eBlock.AI ||
            this.type === eBlock.JS ||
            this.type === eBlock.Hefe;
    }

    public get output(): Stream | null {
        switch (this.type) {
            case eBlock.AI:
            case eBlock.JS:
            case eBlock.Hefe:
                return this._output;
            case eBlock.Data:
                return Stream.mkText(this.data);
            default: return null;
        }
    }
    public async run() {
        if (this.hasCode) {
            let stream = this.notebook.getInputStreamAt(this);
            let output:Stream;
            if (this.type == eBlock.Hefe) {
                output = await this.runSingleCode(stream);
            }
            else if(stream.isArray){
                const array = stream.asArray();
                const results = await Promise.all(array.map(async (item) => {
                    return await this.runSingleCode(item);
                }));
                output = Stream.mkArr(results);
            }
            else {
                output = await this.runSingleCode(stream);
            }
            this._output = output;
        }
        this._dirtyCalc = false;
        Flow.Dirty();
    }

    public async runSingleCode(stream: Stream): Promise<Stream> {
        let code = this.data;
        if (this.type == eBlock.JS) {
            let result = jsEval(code, stream.asString());
            return Stream.mkText(result);
        } else if (this.type == eBlock.Hefe) {
            let input = {
                text: stream.asString(),
                fileName: "Input",
                variables: {
                    Input: stream.asString(),
                },
                folder: null,
            }
            var parse = Parser.Parse(code);
            let result = await Interpreter.Process(input, parse, 99999999);
            if (result != null) {
                if (!!result.error)
                    return Stream.mkText(result.error.message);
                else
                    return result.output;
            }
            return Stream.mkText("Interrupted?");
        } else if (this.type == eBlock.AI) {
            let input = code.replace(/{{STREAM}}/g, stream.asString());
            let server = Config.getllmServers().find(s => s.id == this.aiServerKey);
            if (!server) {
                return Stream.mkText("AI server not found");
            } else {
                console.log("Running Prompt:", input)
                let ai = new AILink(server);
                let result = await ai.simpleChat(input, this.aiModel) ?? "<AI error>";
                return Stream.mkText(result);
            }
        }
        throw 'run path not implemented';
    }

    public static allTypes(): eBlock[] {
        return [
            eBlock.Unknown, eBlock.Data, eBlock.Hefe, eBlock.JS,
            eBlock.Load, eBlock.Store, eBlock.Region, eBlock.Markdown, eBlock.AI
        ];
    }

    public static getTypeName(type: eBlock): string {
        switch (type) {
            case eBlock.Unknown: return "Unknown";
            case eBlock.Data: return "Data";
            case eBlock.Hefe: return "Transform";
            case eBlock.JS: return "JavaScript";
            case eBlock.Load: return "Load";
            case eBlock.Store: return "Store";
            case eBlock.Region: return "Region";
            case eBlock.Markdown: return "Markdown";
            case eBlock.AI: return "AI";
            default: return "Unknown";
        }
    }
}

function jsEval(code: string, stream: string): string {
    try {
        console.log(code);
        eval(code);
        console.log(stream);
    } catch (err) { return `ERROR: ${err}`; }
    return stream;
}


// data interface stored in indexdb
export interface NotebookMeta {
    id: string;
    name?: string;
    blocks: BlockMeta[];
    isDeleted?: boolean;
}

export interface BlockMeta {
    id: string;
    type: eBlock;
    data?: string;
    autoExec?: boolean;
    expandSettings?: boolean;
    expandOutput?: boolean;
    retainData?: boolean;
    aiServerKey?: string;
    aiModel?: string;
}

export enum eBlock {
    Unknown = 0, Data = 1, Hefe = 2, JS = 3,
    Load = 4, Store = 5, Region = 6, Markdown = 7, AI = 8
}