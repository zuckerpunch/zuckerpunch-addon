"use strict"

class DocumentStorage {
  constructor () {
    this.docs = []
  }

  ofType (type) { return this.docs.filter(d => d["@type"] === type) }

  static hashCode (s) {
    if (!(s instanceof String)) s = JSON.stringify(s, null, 2)
    var h = 0; var l = s.length; var i = 0
    while (i < l) h = (h << 5) - h + s.charCodeAt(i++) | 0
    return h
  };

  hashDirty () {
    const updated = []
    this.docs.filter(d => !d._hash).forEach(doc => {
      const _edithash = doc._edithash; delete doc._edithash

      if (doc.times) {
        if (doc.times.length > 1) doc.times = doc.times.filter(t => t.time_id !== doc.id)
        doc.times.sort((a, b) => a.start < b.start ? -1 : (a.start > b.start ? 1 : (a.end < b.end ? 1 : (a.time_id < b.time_id ? 1 : -1))))
      }
      if (doc.creator_ids) doc.creator_ids.sort()

      if ((doc._hash = DocumentStorage.hashCode(doc)) !== _edithash) updated.unshift(doc)
    })
    // move last relevant updated to top for user enjoyment
    updated.filter(doc => doc["@type"] !== "Image").forEach(doc => {
      this.docs.splice(this.docs.indexOf(doc), 1)
      this.docs.unshift(doc)
    })
    return updated
  }

  wholesome () {
    return this.docs.filter(d => !(d._draft) &&
    (
      (d["@type"] === "Event" && (!Object.prototype.hasOwnProperty.call(d, "public") || d.public) && d.name && d.location) ||
      (d["@type"] === "Creator" && d.name && ((d.email && d.email.length) || (d.website && d.website.length))) ||
      (d["@type"] === "Image")
    ))
  }

  getForEdit (type, id) {
    const foundDoc = this.docs.find(d => d.id === id && d["@type"] === type)
    const doc = foundDoc != null ? foundDoc : null ||
                type === "Event" ? { "@type": "Event", id: id, _hash: null, name: null, tags: [], description: null, location: {}, creator_ids: [], ticket_url: null, times: [], timezone: null, images: { large: null } } : null ||
                type === "Creator" ? { "@type": "Creator", id: id, _hash: null, name: null, pagename: null, email: [], website: [], category: [], address: null } : null ||
                type === "Image" ? { "@type": "Image", id: id, _hash: null, _tmpurl: null } : null

    if (!foundDoc) this.docs.push(doc)

    doc._edithash = doc._hash || doc._edithash
    doc._hash = null // 'dirty'
    return doc
  }
}
