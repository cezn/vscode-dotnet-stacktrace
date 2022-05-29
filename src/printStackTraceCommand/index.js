const vscode = require("vscode");
const { EOL } = require("os");

module.exports.default = (trackerFactory, channel) => async () => {
  if (!trackerFactory.tracker.threadId || !vscode.debug.activeDebugSession) {
    channel.appendLine("no threadId or session. skipping");
    return;
  }

  try {
    const frameId = await getCurrentStackFrameId(trackerFactory.tracker.threadId);
    const value = await evaluate("new System.Diagnostics.StackTrace().ToString();", frameId);
    await showValue(value.replace(/^\s*"|"\s*$/g, "").replace(/(?:\\r)?\\n/g, EOL));
  } catch (error) {
    channel.appendLine(JSON.stringify(error));
  }
};

async function getCurrentStackFrameId(threadId) {
  const res = await vscode.debug.activeDebugSession.customRequest("stackTrace", {
    threadId,
    startFrame: 0,
    levels: 20,
  });

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
