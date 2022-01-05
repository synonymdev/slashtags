declare module 'simple-jsonrpc-js' {
  export = class JRPC {
    constructor();

    call(method: string, params: any): Promise<any>;
    toStream(msg: string): void;
    messageHandler(data: string): void;
    on(method: string, params: string[], cb: (...args) => void): void;
  };
}
