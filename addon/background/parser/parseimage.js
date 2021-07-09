"use strict"

class ParseImage {
  parseToStorage (json, sourceUrl, documentStorage, blobStorage) {
    if (json.images) {
      json.images.forEach(img => {
        const event = documentStorage.getForEdit("Event", img.event_id)
        const blob = this.dataURItoBlob(img.base64)
        blobStorage.add(img.src, blob)
        this.ensureImage(event, "poster", img.src, img.width, img.height, documentStorage)
      })
    }
  }

  getIdentifyingPropertyNames () {
    return [
      "images"
    ]
  }

  ensureImage (event, mediaId, _tmpurl, width, height, documentStorage) {
    event.media[mediaId] = { id: `${event.id}-${mediaId}`, width: width, height: height }
    const image = documentStorage.getForEdit("Image", event.media[mediaId].id)
    image._tmpurl = _tmpurl
  }

  dataURItoBlob (dataURI) {
    var byteString = atob(dataURI.split(",")[1])
    var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0]
    var ab = new ArrayBuffer(byteString.length)
    var ia = new Uint8Array(ab)

    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }

    var blob = new Blob([ab], { type: mimeString })
    return blob
  }
}
