/* global chrome */
"use strict"

class ForegroundListener {
  constructor (queue, documentStorage, parseQueueFunc, settingsStorage) {
    ForegroundListener.queue = queue
    ForegroundListener.documentStorage = documentStorage
    ForegroundListener.parseQueueFunc = parseQueueFunc
    ForegroundListener.settingsStorage = settingsStorage
  }

  static contentScriptMessageListener (foregroundMessage, sender, sendResponse) {
    if (foregroundMessage.jsonRaw) {
      ForegroundListener.queue.import(foregroundMessage.jsonRaw, foregroundMessage.url)
    }

    if (foregroundMessage.state === "get-json" && sendResponse) {
      ForegroundListener.parseQueueFunc()
      sendResponse({
        response: JSON.stringify(ForegroundListener.documentStorage.wholesome(), null, 2),
        counters: ForegroundListener.settingsStorage.getCrowdsourcedCounter(),
        debug: JSON.stringify(ForegroundListener.queue.get(), null, 2)
      })
    }

    return { response: null, debug: null }
  }

  start () {
    chrome.runtime.onMessage.addListener(
      ForegroundListener.contentScriptMessageListener
    )
  }
}
