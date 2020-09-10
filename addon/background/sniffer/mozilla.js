/* global chrome, browser */
"use strict"

class Sniffer {
  constructor (queue, settingsStorage) {
    Sniffer.queue = queue
    Sniffer.settingsStorage = settingsStorage
  }

  static requestListener (requestDetails) {
    chrome.tabs.get(requestDetails.tabId, (tab) => {
      const referer = tab.url
      const isEventRelated = referer.includes("/events") ||
                          referer.includes("/about") ||
                          requestDetails.url.includes("/events") ||
                          requestDetails.url.includes("/about") ||
                          requestDetails.url.includes("%2Fevents%2F") ||
                          (requestDetails.requestBody && requestDetails.requestBody.formData != null &&
                             (requestDetails.requestBody.formData.fb_api_req_friendly_name || [""]).join("").includes("Event")) ||
                          (requestDetails.requestBody && requestDetails.requestBody.formData != null &&
                             (requestDetails.requestBody.formData.fb_api_req_friendly_name || [""]).join("").includes("About"))

      if (isEventRelated) Sniffer.handleResponseBody(requestDetails, str => Sniffer.queue.import(str, referer))
    })

    return {}
  }

  /*
   *    sniffed content handler
   */
  static handleResponseBody (requestDetails, f) {
    const filter = browser.webRequest.filterResponseData(requestDetails.requestId)
    const decoder = new TextDecoder("utf-8")
    const encoder = new TextEncoder()
    const data = []
    filter.ondata = event => {
      data.push(event.data)
    }

    filter.onstop = event => {
      let str = ""
      if (data.length === 1) {
        str = decoder.decode(data[0])
      } else {
        for (let i = 0; i < data.length; i++) {
          const stream = i !== data.length - 1
          str += decoder.decode(data[i], { stream })
        }
      }
      filter.write(encoder.encode(str))
      filter.close()
      f(str)
    }
  }

  start () {
    chrome.webRequest.onBeforeRequest.addListener(
      Sniffer.requestListener,
      {
        urls: ["https://*.facebook.com/api/graphql*",
          "https://*.facebook.com/events/discover/query*",
          "https://*.facebook.com/*/dates/*",
          "https://*.facebook.com/ajax/route-definition*",
          "https://*.facebook.com/ajax/navigation*"]
      },
      ["blocking", "requestBody"]
    )
  }
}
