/* global browser */
browser.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
  // if (temporary) return; // skip during development
  switch (reason) {
    case "install":
      {
        const url = browser.runtime.getURL("views/installed/installed.html")
        await browser.tabs.create({ url })
      }
      break
    // see below
  }
})
