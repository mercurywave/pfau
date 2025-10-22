import { DB } from "./DB";
import { util } from "./util";

export class Notebook {
    public blocks: Block[] = [];
    public _meta: NotebookMeta;
    public constructor(meta: NotebookMeta) {
        this._meta = meta;
        this.blocks = meta.blocks.map(obj => new Block(this, obj));
    }

    public FlagDirty(): void {
        DB.SaveNotebook(this);
    }

    public get id(): string { return this._meta.id; }
    public get isDeleted(): boolean { return this._meta.isDeleted ?? false; }
    public get name(): string { return this._meta.name ?? ""; }
    public set name(val: string) {
        if (val != "") this._meta.name = val;
        else delete this._meta.name;
        this.FlagDirty();
    }

    public insertBlock(idx?: number): Block {
        let block = new Block(this, { type: eBlock.Unknown, id: util.UUID() });
        if (idx !== undefined && idx >= 0 && idx < this.blocks.length) {
            this.blocks.splice(idx, 0, block);
        } else {
            this.blocks.push(block);
        }
        this.FlagDirty();
        return block;
    }
}

export class Block {
    public notebook: Notebook;
    public _meta: BlockMeta;
    public constructor(nb: Notebook, meta: BlockMeta) {
        this.notebook = nb;
        this._meta = meta;
    }
    public FlagDirty(): void {
        this.notebook.FlagDirty();
    }
    public get type(): eBlock { return this._meta.type; }
    public get id(): string { return this._meta.id; }
    public get data(): string { return this._meta.data ?? ""; }
    public get autoExec(): boolean { return this._meta.autoExec ?? false; }
    public get expandSettings(): boolean { return this._meta.expandSettings ?? false; }
    public get expandOutput(): boolean { return this._meta.expandOutput ?? false; }
    public get retainData(): boolean { return this._meta.retainData ?? false; }
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
}

export enum eBlock {
    Unknown = 0, Data = 1, Hefe = 2, JS = 3,
    Load = 4, Store = 5, Region = 6, Markdown = 7, AI = 8
}