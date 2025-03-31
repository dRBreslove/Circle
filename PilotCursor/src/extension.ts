import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import { spawn } from 'child_process';
import * as path from 'path';

class CopilotBridge {
    private ws: WebSocket | null = null;
    private copilotProcess: any = null;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async start() {
        try {
            // Start GitHub Copilot CLI
            this.copilotProcess = spawn('github-copilot-cli', ['agent']);
            
            // Set up WebSocket connection to Cursor
            this.ws = new WebSocket('ws://localhost:3000');
            
            this.ws.on('open', () => {
                vscode.window.showInformationMessage('Connected to Cursor IDE');
                this.setupEventListeners();
            });

            this.ws.on('error', (error) => {
                vscode.window.showErrorMessage(`WebSocket error: ${error.message}`);
            });

            this.ws.on('close', () => {
                vscode.window.showInformationMessage('Disconnected from Cursor IDE');
            });

            // Handle Copilot process output
            this.copilotProcess.stdout.on('data', (data: Buffer) => {
                const suggestions = this.parseCopilotOutput(data.toString());
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'copilot-suggestion',
                        data: suggestions
                    }));
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start Copilot bridge: ${error}`);
        }
    }

    private setupEventListeners() {
        // Listen for editor changes
        vscode.workspace.onDidChangeTextDocument(event => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'editor-change',
                    data: {
                        document: event.document.uri.toString(),
                        changes: event.contentChanges
                    }
                }));
            }
        });

        // Listen for cursor position changes
        vscode.window.onDidChangeTextEditorSelection(event => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'cursor-position',
                    data: {
                        position: event.selections[0].active
                    }
                }));
            }
        });
    }

    private parseCopilotOutput(output: string): any {
        try {
            return JSON.parse(output);
        } catch {
            return null;
        }
    }

    stop() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.copilotProcess) {
            this.copilotProcess.kill();
            this.copilotProcess = null;
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    const bridge = new CopilotBridge(context);
    
    let startCommand = vscode.commands.registerCommand('pilotCursor.start', () => {
        bridge.start();
    });

    let toggleCommand = vscode.commands.registerCommand('pilotCursor.toggleCopilot', () => {
        const config = vscode.workspace.getConfiguration('pilotCursor');
        const isEnabled = config.get('copilotEnabled');
        config.update('copilotEnabled', !isEnabled, true);
        vscode.window.showInformationMessage(`GitHub Copilot ${!isEnabled ? 'enabled' : 'disabled'}`);
    });

    context.subscriptions.push(startCommand, toggleCommand);
}

export function deactivate() {
    // Cleanup will be handled by the bridge instance
} 