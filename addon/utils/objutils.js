"use strict"

class ObjUtils {
  static findObjectByPropertyName (obj, propertyName, searchDepth) {
    const parents = this.findParentsByPropertyName(obj, propertyName, searchDepth)

    return parents.map(p => p[propertyName])
  }

  static findParentsByPropertyName (obj, propertyName, searchDepth) {
    searchDepth = searchDepth || 20
    let matches = []

    if (searchDepth > 0) {
      if (typeof obj === "object" && obj !== null) {
        for (var prop in obj) {
          if (prop === propertyName) {
            matches.push(obj)
          } else {
            matches = matches.concat(this.findParentsByPropertyName(obj[prop], propertyName, searchDepth - 1))
          }
        }
      }
      if (Array.isArray(obj)) {
        obj.forEach(e => matches.concat(this.findParentsByPropertyName(e, propertyName, searchDepth - 1)))
      }
    }
    return matches
  }

  static CallOnMatch (rawDoc, keyPaths, f) {
    if (!rawDoc) return

    keyPaths.split("|").forEach(keyPath => {
      let rawCurrent = rawDoc
      let possibleMatch = true

      keyPath.split(".").forEach(keyName => {
        possibleMatch = possibleMatch && rawCurrent && Object.prototype.hasOwnProperty.call(rawCurrent, keyName)
        if (possibleMatch) rawCurrent = rawCurrent[keyName]
      })

      if (possibleMatch) f(rawCurrent)
    })
  }
}
