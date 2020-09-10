/* global chrome */
"use strict"

class OptionsBinder {
  static saveOptions (e) {
    e.preventDefault()
    chrome.storage.local.set({
      puncher_id: document.querySelector("#puncher_id").value.trim(),
      endpoint: document.querySelector("#endpoint").value.trim(),
      endpoint_type: document.querySelector("#endpoint_type").value,
      debug: document.querySelector("#debug").checked,
      // autoexpand: document.querySelector("#autoexpand").checked,
      privacypolicyaccept: document.querySelector("#privacypolicyaccept").checked
    })
  }

  static restoreOptions () {
    function setCurrentChoice (result) {
      document.querySelector("#endpoint").value = result.endpoint || ""
      document.querySelector("#endpoint_type").value = result.endpoint_type || ""
      document.querySelector("#puncher_id").value = result.puncher_id || "*** ERROR: puncher_id not found ***"
      document.querySelector("#debug").checked = result.debug || false
      // document.querySelector("#autoexpand").checked = result.autoexpand || false;
      document.querySelector("#privacypolicyaccept").checked = result.privacypolicyaccept || false
    }

    chrome.storage.local.get(null, setCurrentChoice)
  }
}

document.addEventListener("DOMContentLoaded", OptionsBinder.restoreOptions)
document.querySelector("form").addEventListener("submit", OptionsBinder.saveOptions)
