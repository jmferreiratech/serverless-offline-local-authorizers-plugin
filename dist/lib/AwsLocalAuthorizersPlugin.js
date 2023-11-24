"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsLocalAuthorizerPlugin = void 0;
class AwsLocalAuthorizerPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.handlers = [];
        if (this.serverless.service.provider.name !== "aws") {
            throw new this.serverless.classes.Error("aws-local-authorizers plugin only supports AWS as provider.");
        }
        this.commands = {
            offline: {
                commands: {
                    "local-authorizers": {
                        usage: "Replaces authorizers with local functions for offline testing",
                        lifecycleEvents: [
                            "applyLocalAuthorizers",
                            "start",
                        ],
                    },
                },
            },
        };
        this.serverless.configSchemaHandler.defineFunctionEventProperties('aws', 'http', {
            properties: {
                localAuthorizer: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        type: {
                            anyOf: ['token', 'cognito_user_pools', 'request', 'aws_iam'].map(v => ({ type: 'string', regexp: new RegExp(`^${v}$`, 'i').toString() })),
                        },
                        filePath: { type: "string" },
                    }
                },
            },
        });
        this.hooks = {
            "offline:local-authorizers:applyLocalAuthorizers": () => this.applyLocalAuthorizers(),
            "after:offline:local-authorizers:start": () => this.serverless.pluginManager.run(["offline", "start"]),
        };
    }
    applyLocalAuthorizers() {
        return __awaiter(this, void 0, void 0, function* () {
            const functions = this.serverless.service.functions;
            for (const functionName of Object.keys(functions)) {
                const functionDef = functions[functionName];
                if (functionDef && Array.isArray(functionDef.events)) {
                    for (const event of functionDef.events) {
                        if (!event.http) {
                            continue;
                        }
                        const http = event.http;
                        let localAuthorizerDef = (http.authorizer && http.authorizer.localAuthorizer) ? http.authorizer.localAuthorizer : http.localAuthorizer;
                        if (typeof localAuthorizerDef === "string") {
                            localAuthorizerDef = { name: localAuthorizerDef };
                        }
                        if (localAuthorizerDef) {
                            const mockFnName = localAuthorizerDef.name;
                            console.log('mock', `$__LOCAL_AUTHORIZER_${mockFnName}`);
                            http.authorizer = {
                                name: `$__LOCAL_AUTHORIZER_${mockFnName}`,
                                type: localAuthorizerDef.type || "token",
                            };
                            this.registerHandler(localAuthorizerDef);
                        }
                    }
                }
            }
            this.appendLocalAuthorizers();
        });
    }
    registerHandler(handler) {
        if (!handler.filePath) {
            handler.filePath = 'local-authorizers.js';
        }
        const exists = this.handlers.find(item => item.name === handler.name);
        if (!exists) {
            this.handlers.push(handler);
        }
    }
    appendLocalAuthorizers() {
        this.handlers.forEach(handler => {
            const { name, filePath } = handler;
            const functionKey = `$__LOCAL_AUTHORIZER_${name}`;
            this.serverless.service.functions[functionKey] = {
                memorySize: 256,
                timeout: 30,
                handler: `${filePath.split('.')[0]}.${name}`,
                events: [],
                name: `${this.serverless.service.service}-${this.options.stage}-authorizer${name}`,
                package: {
                    include: [filePath],
                    exclude: []
                },
            };
        });
    }
}
exports.AwsLocalAuthorizerPlugin = AwsLocalAuthorizerPlugin;
//# sourceMappingURL=AwsLocalAuthorizersPlugin.js.map