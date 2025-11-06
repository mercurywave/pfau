import OpenAI from "openai";
import { ILlmServer } from "./config";
import { Rest } from "./util";

export class AILink {
    private _server: ILlmServer;
    private _ai!: AI;
    public constructor(server: ILlmServer) {
        this._server = server;
        if (server.type == "OpenAI")
            this._ai = new AI_OpenAI(server);
        else if (server.type == "LMStudio")
            this._ai = new AI_LmStudio(server);
    }

    public async simpleChat(prompt: string, model: string): Promise<string | null> {
        return await this._ai.simpleChat(prompt, model);
    }
}

abstract class AI {
    public abstract simpleChat(prompt: string, model: string): Promise<string | null>;
}

class AI_OpenAI extends AI {
    private _openAi: OpenAI;
    constructor(server: ILlmServer) {
        super();
        this._openAi = new OpenAI({
            baseURL: server.url,
            apiKey: server.apiKey,
            dangerouslyAllowBrowser: true,
            defaultHeaders: { 'Node-Fetch-Option-Rejectunauthorized': 'false' },
        });
    }
    public async simpleChat(prompt: string, model: string): Promise<string | null> {
        let response = await this._openAi.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ]
        });
        console.log(response);
        return response.choices[0]!.message.content;
    }

}

class AI_LmStudio extends AI {
    private _server: ILlmServer;
    constructor(server: ILlmServer) {
        super();
        this._server = server;
    }
    public async simpleChat(prompt: string, model: string): Promise<string | null> {
        type IGenerateResp = {
            choices: {
                message: {
                    content: string;
                }
            }[];
        };
        let result = await Rest.postLong<IGenerateResp>(this._server.url!, "api/v0/chat/completions", {
            model,
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            stream: false,
            options: {
                temperature: 0.25,
            }
        });
        if (result.success)
            return result.response?.choices[0]?.message.content ?? '';
        else {
            console.error(result.error);
            throw 'Failed to generate';
        }
    }
}