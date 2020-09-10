/* global chrome */
"use strict"

class ForegroundListener {
  constructor (queue, documentStorage, parseQueueFunc) {
    ForegroundListener.queue = queue
    ForegroundListener.documentStorage = documentStorage
    ForegroundListener.parseQueueFunc = parseQueueFunc
  }

  static contentScriptMessageListener (foregroundMessage, sender, sendResponse) {
    if (foregroundMessage.jsonRaw) {
      ForegroundListener.queue.import(foregroundMessage.jsonRaw, foregroundMessage.url)
    }

    if (foregroundMessage.state === "get-json" && sendResponse) {
      ForegroundListener.parseQueueFunc()
      sendResponse({
        response: JSON.stringify(ForegroundListener.documentStorage.wholesome(), null, 2),
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
