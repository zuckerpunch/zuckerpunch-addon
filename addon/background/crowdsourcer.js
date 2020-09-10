/* global chrome */
"use strict"

class CrowdSourcer {
  constructor (documentStorage, blobStorage, settingsStorage) {
    this.documentStorage = documentStorage
    this.blobStorage = blobStorage
    this.settingsStorage = settingsStorage
  }

  publishNew () {
    const wholesomNew = this.documentStorage.wholesome().filter(doc => !this.settingsStorage.getCrowdSourcedHashes().includes(doc._hash))

    if (wholesomNew.length > 0) {
      this.settingsStorage.appendCrowdSourcedHashes(wholesomNew.map(doc => doc._hash))

      chrome.storage.local.get(null, settings => {
        if (!settings.privacypolicyaccept) { return }

        if (settings.endpoint_type === "upsert") {
          wholesomNew.forEach(e => {
            var xhr = new XMLHttpRequest()
            xhr.open("POST", settings.endpoint, true)
            xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8")
            xhr.send(JSON.stringify(e, null, 2))
          })
        }

        if (settings.endpoint_type === "zuckerpunch") {
          var xhr = new XMLHttpRequest()
          xhr.open("POST", settings.endpoint + "/scout", true)
          xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8")
          xhr.setRequestHeader("puncher", settings.puncher_id)
          xhr.onload = () => {
            try {
              const novelties = JSON.parse(xhr.response)
              novelties.forEach(novel => {
                const doc = wholesomNew.find(d => d.id === novel.id && d._hash === novel._hash)
                if (doc) {
                  var xhr = new XMLHttpRequest()
                  xhr.open("POST", settings.endpoint + "/submit", true)
                  xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8")
                  xhr.setRequestHeader("puncher", settings.puncher_id)
                  xhr.setRequestHeader("submit-ticket", novel.ticket)
                  xhr.send(JSON.stringify(doc, null, 2))

                  if (doc["@type"] === "Image" && doc._tmpurl) {
                    const blob = this.blobStorage.getBlob(doc._tmpurl)
                    if (blob) {
                      const formData = new FormData()
                      formData.append("file", blob)

                      const options = {
                        method: "POST",
                        headers: {
                          puncher: settings.puncher_id,
                          "submit-ticket": novel.ticket,
                          "doc-type": doc["@type"],
                          "doc-id": doc.id,
                          "doc-hash": doc._hash
                        },
                        body: formData
                      }
                      fetch(settings.endpoint + "/submit-file", options)
                    }
                  }
                }
              })
            } catch (error) {
              console.error(error)
            }
          }
          xhr.send(JSON.stringify(wholesomNew.map(e => { return { "@type": e["@type"], id: e.id, _hash: e._hash } })))
        }
      })
    }
  }
}
