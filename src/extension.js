const vscode = require("vscode");
const { default: printStackTraceCommand } = require("./printStackTraceCommand");
const { default: TestDebugAdapterTrackerFactory } = require("./TestDebugAdapterTrackerFactory");

let channel = null;
let trackerFactory = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  channel = vscode.window.createOutputChannel(".NET: Stacktrace");
  trackerFactory = new TestDebugAdapterTrackerFactory();

  context.subscriptions.push(
    channel,
    vscode.debug.registerDebugAdapterTrackerFactory("coreclr", trackerFactory),
    vscode.commands.registerCommand(
      "dotnetStacktrace.printStacktrace",
      handleError(printStackTraceCommand(trackerFactory, channel))
    )
  );

  channel.appendLine('Congratulations, your extension "vscode-dotnet-stacktrace" is now active!');
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

const handleError =
  (fn) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      vscode.window.showErrorMessage(formatError(error));
    }
  };

const formatError = (error) =>
  error.message && error.stack
    ? `${error.message}\n${error.stack}`
    : error.message
    ? error.message
    : typeof error === "string"
    ? error
    : JSON.stringify(error);
