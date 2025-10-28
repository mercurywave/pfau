import { Flow } from "./flow";
import { Block, eBlock } from "./notebook";
import { util } from "./util";


export function mkBlock(flow: Flow, block: Block) {
    let root = flow.root("div", { className: "block-wrapper" });

    flow.switchCtl(root, eBlock.Unknown, () => block.type, f => mkUnknown(f, block));
    flow.switchCtl(root, eBlock.Region, () => block.type, f => mkRegion(f, block));
    flow.switchCtl(root, eBlock.Data, () => block.type, f => mkData(f, block));
    flow.switchCtl(root, eBlock.Markdown, () => block.type, f => mkMarkdown(f, block));
    flow.switchCtl(root, eBlock.Store, () => block.type, f => mkSaveLoad(f, block));
    flow.switchCtl(root, eBlock.Load, () => block.type, f => mkSaveLoad(f, block));
    flow.switchCtl(root, eBlock.JS, () => block.type, f => mkJs(f, block));
}

function mkUnknown(flow: Flow, block: Block) {
    let [_, main] = mkBlockElems(flow, block, false);
    bldSettings(flow, block, main);
}

function mkRegion(flow: Flow, block: Block) {
    let [_, main] = mkBlockElems(flow, block, true);
    bldHiddenSettings(flow, block, main);

    let input = flow.elem<HTMLInputElement>(main, "input", {
        className: "edRegion",
        type: "text",
        placeholder: "Region",
        autocomplete: "off",
    });
    flow.bind(() => {
        input.value = block.data;
    });
    input.addEventListener("change", () => {
        block.data = input.value;
    });
}

function mkData(flow: Flow, block: Block) {
    let [_, main] = mkBlockElems(flow, block, true);
    bldHiddenSettings(flow, block, main);

    let text = flow.elem<HTMLTextAreaElement>(main, "textarea", {
        className: "txtIn",
        spellcheck: false
    });
    let update = () => {
        let rows = block.data.split("\n").length;
        text.rows = util.clamp(rows, 4, 20);
    };
    flow.bind(() => {
        text.value = block.data;
        update();
    });
    text.addEventListener("keyup", () => update());
    text.addEventListener("change", () => {
        block.data = text.value;
    });
}

function mkMarkdown(flow: Flow, block: Block) {
    // not actually markdown, just text
    let [_, main] = mkBlockElems(flow, block, true);
    bldHiddenSettings(flow, block, main);

    let text = flow.elem<HTMLTextAreaElement>(main, "textarea", {
        className: "txtDescrip"
    });
    let update = () => {
        let rows = block.data.split("\n").length;
        text.rows = util.clamp(rows, 2, 20);
    };
    flow.bind(() => {
        text.value = block.data;
        update();
    });
    text.addEventListener("keyup", () => update());
    text.addEventListener("change", () => {
        block.data = text.value;
    });
}

function mkSaveLoad(flow: Flow, block: Block) {
    let [_, main] = mkBlockElems(flow, block, true);
    bldHiddenSettings(flow, block, main);

    let subSpan = flow.elem(main, "span", {});
    let lbl = (block.type === eBlock.Store) ? "Save" : "Load";
    flow.elem(subSpan, "label", { innerText: `${lbl}: ` });

    let input = flow.elem<HTMLInputElement>(main, "input", {
        className: "edVariable",
        type: "text",
        placeholder: "Variable",
        autocomplete: "off",
    });
    flow.bind(() => {
        input.value = block.data;
    });
    input.addEventListener("change", () => {
        block.data = input.value;
    });
}

function mkJs(flow: Flow, block: Block) {
    let [left, main] = mkBlockElems(flow, block, true);
    bldPlayButton(flow, block, left);
    bldHiddenSettings(flow, block, main);

    flow.elem(main, "div", { innerText: `function process(stream) {`, className: 'lblJs' });
    let text = flow.elem<HTMLTextAreaElement>(main, "textarea", {
        className: "txtJs"
    });
    flow.elem(main, "div", {
        innerHTML: `&nbsp;&nbsp;&nbsp;&nbsp;return stream;<br>}`,
        className: 'lblJs'
    });
    let output = flow.elem(main, "div", { className: "txtOutput"});

    let update = () => {
        let rows = text.value.split("\n").length;
        text.rows = util.clamp(rows, 2, 20);
    };
    flow.bind(() => {
        text.value = block.data;
        update();
    });
    text.addEventListener("keyup", () => update());
    text.addEventListener("change", () => {
        block.data = text.value;
    });
    
    flow.bind(() => output.innerText = block.output);
}



function bldPlayButton(flow: Flow, block: Block, container: HTMLElement) {
    let btPlay = flow.elem<HTMLButtonElement>(container, "button", {
        type: "button",
        innerText: "▶️",
        className: "btIcon",
    });
    btPlay.addEventListener("click", () => block.run());
}
function mkBlockElems(flow: Flow, block: Block, showSettings: boolean): [HTMLElement, HTMLElement, HTMLElement] {
    let left = flow.child("div", { className: "block-left" });
    let main = flow.child("div", { className: "block-main" });
    let right = flow.child("div", { className: "block-right" });
    if (showSettings) {
        let btGear = flow.elem<HTMLButtonElement>(right, "button", {
            type: "button",
            innerText: "⚙️",
            className: "btIcon",
        });
        btGear.addEventListener("click", () => block.expandSettings = !block.expandSettings);
    }
    return [left, main, right];
}

function bldHiddenSettings(flow: Flow, block: Block, main: HTMLElement): HTMLElement {
    let container = flow.elem(main, "div");
    flow.placeholder(f => bldSettings(f, block, f._root!), container, () => block.expandSettings)
    return container;
}

function bldSettings(flow: Flow, block: Block, container: HTMLElement) {
    let subSpan = flow.elem(container, "span", { className: "block-settings" });
    flow.elem(subSpan, "label", { innerText: "Block Type: " });
    let typePicker = flow.elem<HTMLSelectElement>(subSpan, "select");
    for (const type of Block.allTypes()) {
        let opt = flow.elem<HTMLOptionElement>(typePicker, "option", {
            value: "" + type,
            text: Block.getTypeName(type),
        });
        if (block.type == type)
            opt.selected = true;
    }
    typePicker.addEventListener("change", () => {
        let opt = Number.parseInt(typePicker.value);
        block.type = opt;
    });
}