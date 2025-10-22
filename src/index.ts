import { Config } from "./config";
import { Flow, Route } from "./flow";


document.addEventListener("DOMContentLoaded", () => {
    setup().then(initUi);
});

async function setup(): Promise<void> {
    await Config.LoadSettings();
    await Route.Init();
}
window.addEventListener('popstate', () => Route.OnNavigate());

function initUi() {
    let main = document.querySelector("body") as HTMLElement;
    Flow.Init(main, mkRoot);
}

Route.RegisterDefault("menu", (flow) => {
    mkMainMenu(flow);
});

Route.Register("game", (flow, path) => {
    mkNotebook(flow, path['id'] ?? "");
});

function mkRoot(flow: Flow) {
    let main = flow.child("div", { id: "main" });

    let outer = flow.elem(main, "div", { id: "mainOuter" });
    let bind = flow.bindObject(() => 'k' + Route.GetUniqPage(), mkMain, outer);
    bind.setAnimRemoval(150, "fade-out-view");
    flow.bindAsMainRouteScroll(outer);
}

function mkMain(flow: Flow) {
    let viewContainer = flow.root("div", { className: "viewContainer" });
    flow.routePage(viewContainer, Route.GetUniqPage());
}

function mkMainMenu(flow: Flow){
    let container = flow.child("div", { className: "menu-main" });
}

function mkNotebook(flow: Flow, id: string){
    let container = flow.child("div", { className: "notebook-main" });
}