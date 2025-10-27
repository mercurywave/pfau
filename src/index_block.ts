import { Flow } from "./flow";
import { Block, eBlock } from "./notebook";


export function mkBlock(flow: Flow, block: Block) {
    let root = flow.root("div", { className: "block-wrapper" });

    flow.switchCtl(root, eBlock.Unknown, () => block.type, f => mkUnknown(f, block));
}

function mkUnknown(flow: Flow, block: Block) {
    let [_, main] = mkBlockElems(flow);
    bldSettings(flow, block, main);
}



function mkBlockElems(flow: Flow): [HTMLElement, HTMLElement, HTMLElement] {
    let left = flow.child("div", { className: "block-left" });
    let main = flow.child("div", { className: "block-main" });
    let right = flow.child("div", { className: "block-right" });
    return [left, main, right];
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