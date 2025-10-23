import { Config } from "./config";
import { DB } from "./DB";
import { Flow, Route } from "./flow";


document.addEventListener("DOMContentLoaded", () => {
    setup().then(initUi);
});

async function setup(): Promise<void> {
    await Config.LoadSettings();
    await DB.Init();
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

Route.Register("book", (flow, path) => {
    mkNotebook(flow, path['id'] ?? "");
}, (path) => {
    if (!path['id'] || !DB.GetBookById(path['id']))
        Route.ErrorFallback();
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

function mkMainMenu(flow: Flow) {
    let container = flow.child("div", { className: "menu-main" });
    for (const saved of DB.AllBooks()) {
        let btOpenNotebook = flow.elem<HTMLAnchorElement>(container, "a", {
            innerText: saved.name ?? "[Temporary Notebook]",
            title: saved.id,
        });
        btOpenNotebook.addEventListener("click", () => Route.Launch("book", { id: saved.id }));
    }
    let btNewNotebook = flow.elem<HTMLButtonElement>(container, "button", {
        type: "button",
        innerText: "+New Notebook",
        className: "btMenu",
    });
    btNewNotebook.addEventListener("click", () => {
        let book = DB.CreateNotebook();
        Route.Launch("book", { id: book.id });
    });
}

function mkNotebook(flow: Flow, id: string) {
    let container = flow.child("div", { className: "notebook-main" });
}