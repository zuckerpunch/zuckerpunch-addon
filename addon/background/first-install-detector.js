/* global browser, chrome */
if (typeof browser !== "undefined" && browser.runtime && browser.runtime.onInstalled) {
  browser.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
    switch (reason) {
      case "install":
        {
          const url = browser.runtime.getURL("views/installed/installed.html")
          await browser.tabs.create({ url })
        }
        break
    }
  })
}

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
    switch (reason) {
      case "install":
        {
          const url = chrome.runtime.getURL("views/installed/installed.html")
          await chrome.tabs.create({ url })
        }
        break
    }
  })
}
