module.exports.default = class TestDebugAdapterTrackerFactory {
  tracker = new TestDebugAdapterTracker();

  createDebugAdapterTracker(_session) {
    return this.tracker;
  }
};

class TestDebugAdapterTracker {
  threadId = null;
  onDidSendMessage(message) {
    if (message.event === "stopped") this.threadId = parseInt(message.body.threadId, 10);
    else if (message.event === "exited" || message.event === "terminated" || message.event === "continued")
      this.threadId = null;
  }
}
