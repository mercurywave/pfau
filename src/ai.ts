import { ILlmServer } from "./config";

export class AILink{
    private _server: ILlmServer;
    public constructor(server: ILlmServer) {
        this._server = server;
    }
}