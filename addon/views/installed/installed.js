/* global chrome */
"use strict"

function userClick (e) {
  if (e.target.id === "buttonYes" || e.target.id === "buttonNo") {
    chrome.storage.local.set({
      privacypolicyaccept: e.target.id === "buttonYes"
    })
    document.body.className += " selection-done"
  }
}

document.addEventListener("click", userClick, false)
