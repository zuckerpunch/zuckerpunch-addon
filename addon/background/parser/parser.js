"use strict"

class Parser {
  constructor (parsers, documentStorage, blobStorage, settingsStorage) {
    this.parsers = parsers
    this.documentStorage = documentStorage
    this.blobStorage = blobStorage
    this.settingsStorage = settingsStorage
    this.identifyingPropertyNames = [].concat.apply([], this.parsers.map(parser => parser.getIdentifyingPropertyNames()))
  }

  parse (json, sourceUrl) {
    this.parsers.forEach(parser => {
      const backparse = parser.parseToStorage(json, sourceUrl, this.documentStorage, this.blobStorage, this.settingsStorage)
      if (backparse) backparse.forEach(jsonout => this.parse(jsonout, sourceUrl, this.documentStorage, this.blobStorage, this.settingsStorage))
    })
  }

  isWorthParsing (jsomString) {
    if (!jsomString) return false
    return this.parsers.some(parser => parser.getIdentifyingPropertyNames().some(searchterm => jsomString.includes(`"${searchterm}"`)))
  }

  getIdentifyingPropertyNames () {
    return this.identifyingPropertyNames
  }
}
