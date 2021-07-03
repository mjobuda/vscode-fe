import * as vscode from 'vscode';
import * as fs from 'fs';
import { EndOfLineState, TokenClass } from 'typescript';

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

const legend = (function () {
	// const tokenTypesLegend = [
	// 	'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
	// 	'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
	// 	'method', 'macro', 'variable', 'parameter', 'property', 'label'
	// ];
	const tokenTypesLegend = [
	"Error",

    "Newline",

    /// Virtual tokens emitted by the parser
    "Indent",
    "Dedent",

    "Name",
    "Int",
    "Hex",
    "Octal",
    "Binary",
    // Float
    "Text",
    "True",
    "False",
    // None
    "Assert",
    "Break",
    "Continue",
    "Contract",
    "Def",
    "Const",
    "Elif",
    "Else",
    "Emit",
    "Event",
    "Idx",
    "If",
    "Import",
    "Pragma",
    "Pass",
    "For",
    "Pub",
    "Return",
    "Revert",
    "Struct",
    "Type",
    "While",
    "And",
    "As",
    "In",
    "Not",
    "Or",
    // Symbols
    "ParenOpen",
    "ParenClose",
    "BracketOpen",
    "BracketClose",
    "BraceOpen",
    "BraceClose",
    "Colon",
    "ColonColon",
    "Comma",
    "Semi",
    "Plus",
    "Minus",
    "Star",
    "Slash",
    "Pipe",
    "Amper",
    "Lt",
    "LtLt",
    "Gt",
    "GtGt",
    "Eq",
    "Dot",
    "Percent",
    "EqEq",
    "NotEq",
    "LtEq",
    "GtEq",
    "Tilde",
    "Hat",
    "StarStar",
    "StarStarEq",
    "PlusEq",
    "MinusEq",
    "StarEq",
    "SlashEq",
    "PercentEq",
    "AmperEq",
    "PipeEq",
    "HatEq",
    "LtLtEq",
    "GtGtEq",
    "Arrow"
	];
	tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

	const tokenModifiersLegend = [
		'declaration', 'documentation', 'readonly', 'static', 'abstract', 'deprecated',
		'modification', 'async'
	];
	tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

	return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();

export function activate(context: vscode.ExtensionContext) {
	var dtp = new DocumentSemanticTokensProvider();
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'fe', scheme: 'file' }, dtp, legend));
}

interface IParsedToken {
	line: number;
	startCharacter: number;
	length: number;
	tokenType: string;
	tokenModifiers: string[];
}

function getLineNumberFromCharPos(text,pos)
{
	const res = text.slice(0,pos);
	const lines = (res.match(/\n/g) || '').length + 1
	return lines;
}
function getLineStartPosFromCharPos(text,pos)
{
	if(pos==0) return 0;
	const buf = text.slice(0,pos).split('\n');
	const ret = buf.length-1;
	return ret;
}

export function getFeTempOutputFolder() {
	return "/home/mmm/github/vscode-fe/.vscode/fe_output";
}
function getTokenFileName() {
	return getFeTempOutputFolder() + "/module.tokens";
}

function getTokensFromTokenFile() {
	var lines;
	try {
		const fileName = getTokenFileName()
		lines = fs.readFileSync(fileName).toString();
	} catch (err) {
		console.error(err)
	}
	const ret = lines.split('Token').slice(1, -1);
	return ret;
}
function getTokenDataLine(text,documentText) {
	const start = Number(text.split('\n').slice(1, -2)[3].replace(/\s+/g, '').split(":")[1].replace(",",""));
	
	const ret = getLineNumberFromCharPos(documentText,start);
	return ret;
}
function getTokenDataStartCharacter(text,documentText) {
	//nasty way to extract the data!!! you should change this
	const start = Number(text.split('\n').slice(1, -2)[3].replace(/\s+/g, '').split(":")[1].replace(",",""));
if (start==0) return 0;
	const ret = documentText.slice(0, start).split('\n');
	if (ret.length==1) return ret[0].length;
	return ret[ret.length - 1].length+1;
}
function getTokenDataLength(text) {
	//nasty way to extract the data!!! you should change this
	const start = Number(text.split('\n').slice(1, -2)[3].replace(/\s+/g, '').split(":")[1].replace(",",""));
	const end = Number(text.split('\n').slice(1, -2)[4].replace(/\s+/g, '').split(":")[1].replace(",",""));	
	return end-start;
}
function getTokenDataTokenType(text) {
	const ret = text.split('\n').slice(1, -2)[0].replace(/\s+/g, '').split(":")[1].replace(",","");
	return ret;
}
function getTokenDataTokenModifiers(text) {
	return [];
}
class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		const moduleTokens = getTokensFromTokenFile();
		// const allTokens = this._parseText(document.getText());
		const builder = new vscode.SemanticTokensBuilder();
		moduleTokens.forEach((token) => {
			// const ddebug = [getTokenDataLine(token,document.getText()),
			// 	getTokenDataStartCharacter(token,document.getText()),
			// 	getTokenDataLength(token),
			// 	getTokenDataTokenType(token),
			// 	this._encodeTokenModifiers(getTokenDataTokenModifiers(token))];
			builder.push(
				// token.line, token.startCharacter, token.length, this._encodeTokenType(token.tokenType), this._encodeTokenModifiers(token.tokenModifiers)
				getTokenDataLine(token,document.getText())-1,
				getTokenDataStartCharacter(token,document.getText())-1,
				getTokenDataLength(token),
				this._encodeTokenType(getTokenDataTokenType(token)),
				this._encodeTokenModifiers(getTokenDataTokenModifiers(token))

			);
		});
		return builder.build();
	}

	private _encodeTokenType(tokenType: string): number {
		if (tokenTypes.has(tokenType)) {
			return tokenTypes.get(tokenType)!;
		} else if (tokenType === 'notInLegend') {
			return tokenTypes.size + 2;
		}
		return 0;
	}

	private _encodeTokenModifiers(strTokenModifiers: string[]): number {
		let result = 0;
		for (let i = 0; i < strTokenModifiers.length; i++) {
			const tokenModifier = strTokenModifiers[i];
			if (tokenModifiers.has(tokenModifier)) {
				result = result | (1 << tokenModifiers.get(tokenModifier)!);
			} else if (tokenModifier === 'notInLegend') {
				result = result | (1 << tokenModifiers.size + 2);
			}
		}
		return result;
	}

	private _parseText(text: string): IParsedToken[] {
		const r: IParsedToken[] = [];
		const lines = text.split(/\r\n|\r|\n/);
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			let currentOffset = 0;
			do {
				const openOffset = line.indexOf('[', currentOffset);
				if (openOffset === -1) {
					break;
				}
				const closeOffset = line.indexOf(']', openOffset);
				if (closeOffset === -1) {
					break;
				}
				const tokenData = this._parseTextToken(line.substring(openOffset + 1, closeOffset));
				r.push({
					line: i,
					startCharacter: openOffset + 1,
					length: closeOffset - openOffset - 1,
					tokenType: tokenData.tokenType,
					tokenModifiers: tokenData.tokenModifiers
				});
				currentOffset = closeOffset;
			} while (true);
		}
		return r;
	}

	private _parseTextToken(text: string): { tokenType: string; tokenModifiers: string[]; } {
		const parts = text.split('.');
		return {
			tokenType: parts[0],
			tokenModifiers: parts.slice(1)
		};
	}
}
