"use strict"

class BlobStorage {
  constructor () {
    this.blobs = []
    this.staleMinutes = 3
  }

  add (key, blob) {
    if (!this.blobs.some(i => i.key === key)) {
      this.blobs.push({
        key: key,
        blob: blob,
        _ts: Date.now()
      })
    }
  }

  getBlob (key) {
    const blob = this.blobs.find(b => b.key === key)
    return blob ? blob.blob : null
  }

  purgeStale () {
    this.blobs.filter(i => i._ts + (60000 * this.staleMinutes) < Date.now()).forEach(i => {
      this.blobs.splice(this.blobs.indexOf(i), 1)
    })
  }
}
