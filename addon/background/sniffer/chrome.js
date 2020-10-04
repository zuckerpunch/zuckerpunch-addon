/* global chrome */
"use strict"

class Sniffer {
  constructor (queue, settingsStorage) {
    Sniffer.queue = queue
    Sniffer.settingsStorage = settingsStorage
    Sniffer.tabDebugActivity = []
  }

  static attachDebugger (tabId, url) {
    const active = Sniffer.tabDebugActivity.find(e => e.tabId === tabId)

    if (active) {
      active.lastActive = Date.now()
      return
    }

    Sniffer.tabDebugActivity.push({ tabId: tabId, created: Date.now(), lastActive: Date.now(), invokerUrl: url, contentRequests: [] })
    chrome.debugger.attach({ tabId: tabId }, "1.3", () => chrome.debugger.sendCommand({ tabId: tabId }, "Network.enable"))
    Sniffer.settingsStorage.ifDebugOn(() => console.log("Ataching debugger for tabId " + tabId))
    Sniffer.launchDebugDetacher(tabId)
  }

  static onBeforeRequest (requestDetails) {
    chrome.tabs.get(requestDetails.tabId, (tab) => {
      const url = tab.pendingUrl || tab.url || requestDetails.url
      const isEventRelated = url.startsWith("https") && (url.includes("/events") || url.includes("/about"))
      if (isEventRelated) {
        Sniffer.attachDebugger(requestDetails.tabId, url)
      }
    })
  }

  static allEventHandler (debuggeeId, message, params) {
    const active = Sniffer.tabDebugActivity.find(e => e.tabId === debuggeeId.tabId)

    if (!active) return

    switch (message) {
      case "Network.requestWillBeSent":
        if (active && params.request.url !== active.invokerUrl && ["graphql", "events", "dates"].some(s => params.request.url.includes(s))) {
          active.contentRequests.push({ requestId: params.requestId, postData: params.request.postData, url: params.request.url, referer: params.documentURL })
        }
        break
      case "Network.responseReceived": {
        const openRequest = active.contentRequests.find((e) => e.requestId === params.requestId)
        if (openRequest && ["text/javascript", "application/x-javascript", "application/json"].includes(params.response.mimeType)) {
          openRequest.isJson = true
        } else {
          if (openRequest) Sniffer.settingsStorage.ifDebugOn(() => console.log(`rejecting MIME ${params.response.mimeType}`))
        }
        break
      }
      case "Network.loadingFinished": {
        const loadedRequest = active.contentRequests.find((e) => e.requestId === params.requestId)
        if (loadedRequest && loadedRequest.isJson) {
          chrome.debugger.sendCommand({ tabId: debuggeeId.tabId }, "Network.getResponseBody", { requestId: params.requestId }, (response) => {
            if (response) {
              const isEventRelated = loadedRequest.referer.includes("/events") ||
                                    loadedRequest.url.includes("/events") ||
                                    loadedRequest.url.includes("%2Fevents%2F") ||
                                    (loadedRequest.postData && loadedRequest.postData.includes("Event")) ||
                                    (loadedRequest.postData && loadedRequest.postData.includes("About"))

              if (isEventRelated) {
                Sniffer.queue.import(response.body, loadedRequest.url)
              }
            }
          })
        }
        break
      }
    }
  }

  static launchDebugDetacher (tabId) {
    const secondsToWait = 60
    const activity = Sniffer.tabDebugActivity.find(e => e.tabId === tabId)
    const msToDetach = Math.max(secondsToWait * 1000 + activity.lastActive - Date.now(), 2500 + activity.created - Date.now())

    if (msToDetach > 0) {
      window.setTimeout(() => Sniffer.launchDebugDetacher(tabId), msToDetach)
    } else {
      Sniffer.settingsStorage.ifDebugOn(() => console.log("Detaching debugger for tabId " + tabId))
      Sniffer.tabDebugActivity.splice(Sniffer.tabDebugActivity.indexOf(activity), 1)
      chrome.tabs.get(tabId, () => {
        if (!chrome.runtime.lastError) chrome.debugger.detach({ tabId: tabId })
      })
    }
  }

  start () {
    chrome.debugger.onEvent.addListener(Sniffer.allEventHandler)
    chrome.webRequest.onBeforeRequest.addListener(Sniffer.onBeforeRequest, { urls: ["https://*.facebook.com/*events*"] }, ["blocking", "requestBody"])
  }
}
