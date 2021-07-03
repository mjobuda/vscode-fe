export function init(context: any, type: any): void;
declare function compileActiveFileCommand(contractFile: any): void;
declare function compileActiveFile(contractFile: any): Promise<any>;
export { compileActiveFileCommand as compileContractCommand, compileActiveFile as compileContract };
