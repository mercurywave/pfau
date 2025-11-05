import { AILink } from "./ai";
import { Config, ILlmServer, IService } from "./config";
import { Flow } from "./flow";
import { util } from "./util";

type Option = [value: string, display: string];
function serverToOption(svc: IService): Option {
    return [svc.key ?? "", svc.name];
}

export function mkSettings(flow: Flow) {
    mkMain(flow);
}

function mkMain(flow: Flow) {
    addSection(flow, "LLM Servers", mkLlmServers);
    let doShowAi = () => Config.getllmServers().length < 1;
}

function mkLlmServers(flow: Flow) {
    let btAddServer = flow.child<HTMLButtonElement>("button", {
        type: "button",
        innerText: "+ Add Server",
        className: "btSetting",
    });
    btAddServer.addEventListener("click", () => {
        let id = util.UUID();
        Config.getllmServers().push({ id: id, type: Config.llmPipelines[0]!.key ?? "", url: "" });
        Flow.Dirty();
    });
    let elList = flow.child("div", { className: "liSetServers" });
    flow.bindArray(() => Config.getllmServers(), mkLlmLine, elList);
}

function mkLlmLine(flow: Flow, server: ILlmServer) {
    let span = flow.root("div", { className: "setServer" });
    let opts: Option[] = Config.llmPipelines.map(serverToOption);
    addDropDown(flow, opts,
        () => server.type ?? "",
        v => server.type = v,
    );

    let lblUrl = flow.child("label", { innerText: " URL: " });
    boundTextInput(flow, () => server.url ?? "", v => server.url = v, lblUrl);

    let lblAlias = flow.child("label", { innerText: " Alias: " });
    let inAlias = boundTextInput(flow, () => server.alias ?? "", v => server.alias = v, lblAlias);
    inAlias.placeholder = server.id;

    let btRemove = flow.child<HTMLButtonElement>("button", {
        type: "button",
        innerText: "X",
        className: "btX",
    });
    btRemove.addEventListener("click", () => {
        Config.setllmServers(Config.getllmServers().filter(s => s !== server));
        Config.Save();
        Flow.Dirty();
    });

    // let bttest = flow.child<HTMLButtonElement>("button", {
    //     type: "button",
    //     innerText: "Test",
    // });
    // let lblResult = flow.child("span");
    // bttest.addEventListener("click", async () => {
    //     let ai = new AILink(server);
    //     let [succes, msg] = await ai.TestConnection();
    //     lblResult.innerText = msg;
    //     lblResult.classList.toggle("setErr", !succes);
    // });
}
function getServerName(server: ILlmServer): string {
    return server.alias || server.url || server.id || "???";
}




function boundTextInput(flow: Flow, getter: () => string, setter: (val: string) => void, parent?: HTMLElement): HTMLInputElement {
    let input = flow.elem<HTMLInputElement>(parent, "input", {
        className: "edSetText",
        type: "text",
        autocomplete: "off",
    });
    flow.bind(() => {
        input.value = getter();
    });
    input.addEventListener("change", () => {
        setter(input.value);
        Config.Save();
    });
    return input;
}

function boundTextArea(flow: Flow, getter: () => string, setter: (val: string) => void, parent?: HTMLElement): HTMLTextAreaElement {
    let input = flow.elem<HTMLTextAreaElement>(parent, "textarea", {
        className: "edSetTextArea",
        autocomplete: "off",
    });
    flow.bind(() => {
        input.value = getter();
    });
    input.addEventListener("change", () => {
        setter(input.value);
        Config.Save();
    });
    return input;
}

function addDropDown(flow: Flow, opts: Option[], getter: () => string, setter: (val: string) => void, parent?: HTMLElement): HTMLSelectElement {
    // assumes a static list, like options available in settings
    let dropDown = flow.elem<HTMLSelectElement>(parent, "select");
    for (const pair of opts) {
        flow.elem<HTMLOptionElement>(dropDown, "option", { value: pair[0], innerText: pair[1] });
    }
    flow.bind(() => dropDown.value = getter());
    dropDown.addEventListener("change", () => {
        setter(dropDown.value);
        Config.Save();
    });
    return dropDown;
}

function addBoundDropDown(flow: Flow, opts: () => Option[], getter: () => string, setter: (val: string) => void, parent?: HTMLElement): HTMLSelectElement {
    let dropDown = flow.elem<HTMLSelectElement>(parent, "select");
    flow.bindArray(opts, _boundOpt, dropDown);
    flow.bind(() => dropDown.value = getter());
    dropDown.addEventListener("change", () => {
        setter(dropDown.value);
        Config.Save();
    });
    return dropDown;
}
function _boundOpt(flow: Flow, opt: Option) {
    let root = flow.root<HTMLOptionElement>("option", { value: opt[0] });
    flow.bind(() => root.innerText = opt[1]);
}


function addSection(flow: Flow, label: string, builder: (flow: Flow) => void, hideIf?: () => boolean) {
    let host = flow.child("div");
    flow.elem(host, "div", { innerText: label, className: "settingHead" });
    let section = flow.elem(host, "div", { className: "section" });
    flow.bindCtl(builder, section);
    if (hideIf)
        flow.conditionalStyle(host, "noDisp", hideIf);
}