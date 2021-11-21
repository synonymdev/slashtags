declare module 'simple-jsonrpc-js' {
  export = class JRPC {
    constructor();

    call(method: string, params: any): Promise<any>;
    toStream(msg: string): void;
    messageHandler(any): void;
  };
}
