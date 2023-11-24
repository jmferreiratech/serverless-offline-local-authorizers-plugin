import { IServerlessOptions, Serverless } from "./Serverless";
export declare class AwsLocalAuthorizerPlugin {
    private serverless;
    private options;
    hooks: {
        [key: string]: () => void;
    };
    commands: {
        [key: string]: any;
    };
    private handlers;
    constructor(serverless: Serverless, options: IServerlessOptions);
    private applyLocalAuthorizers;
    private registerHandler;
    private appendLocalAuthorizers;
}
