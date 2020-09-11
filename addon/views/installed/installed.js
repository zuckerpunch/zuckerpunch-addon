/* global browser, chrome */
"use strict"

function userClick (e) {
  if (e.target.id === "buttonYes" || e.target.id === "buttonNo") {
    chrome.storage.local.set({
      privacypolicyaccept: e.target.id === "buttonYes"
    })
    document.body.className += " selection-done"
  }

  if (e.target.id === "venuelistlink") {
    const googleSearch = "https://www.google.com/search?q=site%3Afacebook.com+inurl%3A%2Fevents%2F"
    chrome.tabs.create({ url: googleSearch })
  }
}

document.addEventListener("click", userClick, false)

document.body.className = (typeof browser !== "undefined") ? "mozilla" : "chrome"
