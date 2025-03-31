const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('pilotCursor.helloWorld', function () {
        vscode.window.showInformationMessage('Hello World from PilotCursor!');
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};