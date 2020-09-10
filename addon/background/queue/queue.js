/* global ObjUtils */
"use strict"

class Queue {
  constructor (settingsStorage, identifyingPropertyNames) {
    this.settingsStorage = settingsStorage
    this.identifyingPropertyNames = identifyingPropertyNames
    this.queueitems = []
  }

  import (rawString, sourceUrl) {
    this.parseRawToImportable(rawString).forEach(jsonParsed => {
      Queue.deleteUserFields(jsonParsed)
      this.queueitems.push({ data: jsonParsed, sourceUrl: sourceUrl })
    })
  }

  get () {
    return this.queueitems
  }

  getNew () {
    const newItems = this.queueitems.filter(i => !i._queueReturnedNew)
    newItems.forEach(i => { i._queueReturnedNew = true })
    this.settingsStorage.ifDebugOff(() => {
      this.queueitems.filter(i => i._queueReturnedNew).forEach(i => this.queueitems.splice(this.queueitems.indexOf(i), 1))
    })
    return newItems
  }

  parseRawToImportable (rawString) {
    const jsons = []
    Queue.parseToDocuments(rawString).forEach(jsonLine => {
      try {
        if (this.isWorthParsing(jsonLine)) {
          const json = JSON.parse(jsonLine)
          jsons.push(json)
        } else {
          this.settingsStorage.ifDebugOn(() => {
            console.log("Queue skipped importing the following since no identifying field names were found:")
            console.log(jsonLine)
          })
        }
      } catch (e) {
        console.warn(`${e.name}: ${e.message}`)
        console.warn(jsonLine)
      }
    })
    return jsons
  }

  static parseToDocuments (rawString) {
    let clean = rawString.replace(/for \(;;\);/g, "").replace("{\"__type\":\"last_response\"}", "")
    clean = clean.replace(/<br>/g, "\n")
    const goo = clean.match(/\{\s*"successful_results":\s*\d*,\s*"error_results":\s*\d*,\s*"skipped_results":\s*\d*\s*\}/)
    if (goo) goo.forEach((m) => { clean = clean.replace(m, "") })
    clean = clean.substring(0, clean.lastIndexOf("}") + 1)
    return clean.split("\n")
  }

  isWorthParsing (jsonString) {
    return this.identifyingPropertyNames.some(name => jsonString.includes(`"${name}"`))
  }

  static deleteUserFields (json) {
    const userSpecificFieldnames = ["social_context", "invitee_candidates_v2", "/me", "viewer", "viewer_actor", "payload", "extensions"]

    userSpecificFieldnames.forEach(name => {
      ObjUtils.findParentsByPropertyName(json, name).forEach(parent => {
        delete parent[name]
      })
    })

    ObjUtils.findParentsByPropertyName(json, "entity").forEach(parent => {
      if (parent.entity && parent.entity.__typename === "User") delete parent.entity
    })
  }
}
