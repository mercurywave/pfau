import { Flow } from "./flow";
import { Block, eBlock } from "./notebook";


export function mkBlock(flow: Flow, block: Block) {
    let root = flow.root("div", { className: "block-wrapper" });

    flow.switchCtl(root, eBlock.Unknown, () => block.type, f => mkUnknown(f, block));
    flow.switchCtl(root, eBlock.Region, () => block.type, f => mkRegion(f, block));
}

function mkUnknown(flow: Flow, block: Block) {
    let [_, main] = mkBlockElems(flow, block, false);
    bldSettings(flow, block, main);
}

function mkRegion(flow: Flow, block: Block) {
    let [_, main] = mkBlockElems(flow, block, true);
    bldHiddenSettings(flow, block, main);
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

function bldHiddenSettings(flow: Flow, block: Block, main: HTMLElement) {
    let container = flow.elem(main, "div");
    flow.placeholder(f => bldSettings(f, block, f._root!), container, () => block.expandSettings)
}

function bldSettings(flow: Flow, block: Block, container: HTMLElement) {
    let subSpan = flow.elem(container, "span", { className: "block-settings" });
    flow.elem(subSpan, "label", { innerText: "Block Type:" })
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