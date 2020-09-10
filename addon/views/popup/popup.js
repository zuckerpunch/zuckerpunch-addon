/* global chrome, browser, JSONViewer */

function copyToClipboard () {
  var copyText = document.getElementById("copy_helper")
  copyText.select()
  copyText.setSelectionRange(0, 999999) /* For mobile devices */
  document.execCommand("copy")
}

function handleResponse (response) {
  const copyHelper = document.getElementById("copy_helper")
  if (copyHelper.value !== response.response) {
    copyHelper.value = response.response
    const jsonParsed = JSON.parse(response.response)
    jsonViewer.showJSON(jsonParsed, -1, 2)
    document.body.className = jsonParsed.length > 0 ? "json_set" : "json_empty"
  }

  chrome.storage.local.get("debug", debugSettings => {
    if (debugSettings.debug) {
      const debugJson = document.querySelector("#debug_json")
      if (debugJson.lastResponse !== response.debug) {
        debugJson.value = response.debug
        debugJson.lastResponse = response.debug
      }
    } else {
      document.querySelector("#debug_json").value = "Debug enabled - start browsing events to get debug data"
    }
  })
}

chrome.storage.local.get("debug", settings => {
  document.querySelector("#debug_panel").style.display = settings.debug ? "inline" : "none"
})

chrome.storage.local.get("privacypolicyaccept", settings => {
  document.querySelector("#crowdsource_promote").style.display = settings.privacypolicyaccept ? "none" : "block"
})

document.addEventListener("click", (e) => {
  if (e.target.id === "copy_to_clipboard") {
    copyToClipboard()
  }
  if (e.target.id === "privacypolicylink") {
    const ppurl = browser.runtime.getURL("views/installed/installed.html")
    document.location = ppurl
  }
})

var jsonViewer = new JSONViewer()
document.querySelector("#json").appendChild(jsonViewer.getContainer())

const refreshJson = () => chrome.runtime.sendMessage({ state: "get-json" }, (response) => response ? handleResponse(response) : null)

refreshJson()
window.setInterval(() => {
  refreshJson()
}, 1000)
