const { EOL } = require("os");
const vscode = require("vscode");
let channel = null;
let threadId = null;
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  channel = vscode.window.createOutputChannel(".NET: Stacktrace");
  context.subscriptions.push(channel);
  context.subscriptions.push(
    onDebugAdapterMessage((message) => {
      if (message.event === "stopped")
        threadId = parseInt(message.body.threadId, 10);
      else if (
        message.event === "exited" ||
        message.event === "terminated" ||
        message.event === "continued"
      )
        threadId = null;
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "dotnetStacktrace.printStacktrace",
      async () => {
        if (!threadId || !vscode.debug.activeDebugSession) {
          channel.appendLine("no threadId or session. skipping");
          return;
        }

        try {
          const frameId = await getCurrentStackFrameId(threadId);
          const value = await evaluate(
            "new System.Diagnostics.StackTrace().ToString();",
            frameId
          );
          await showValue(
            value.replace(/^\s*"|"\s*$/g, "").replace(/(?:\\r)?\\n/g, EOL)
          );
        } catch (error) {
          channel.appendLine(JSON.stringify(error));
        }
      }
    )
  );

  channel.appendLine(
    'Congratulations, your extension "vscode-dotnet-stacktrace" is now active!'
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

function onDebugAdapterMessage(cb) {
  return vscode.debug.registerDebugAdapterTrackerFactory("coreclr", {
    createDebugAdapterTracker(_session) {
      return {
        onDidSendMessage: cb,
      };
    },
  });
}

async function getCurrentStackFrameId(threadId) {
  const res = await vscode.debug.activeDebugSession.customRequest(
    "stackTrace",
    {
      threadId,
      startFrame: 0,
      levels: 20,
    }
  );

  return res.stackFrames[0].id;
}

async function evaluate(expression, frameId) {
  const res = await vscode.debug.activeDebugSession.customRequest("evaluate", {
    expression,
    frameId,
    context: "repl",
  });

  return res.result;
}

async function showValue(value) {
  const doc = await vscode.workspace.openTextDocument({
    language: "plaintext",
    content: value,
  });
  await vscode.window.showTextDocument(doc);
}
