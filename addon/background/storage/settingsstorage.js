/* global chrome */
"use strict"

class SettingsStorage {
  constructor () {
    this.MAX_HASH_CACHE = 5000
    this.ON_MAX_REDUCE = 100
    this.localStorageObj = {}
    this.timezoneMap = {}
    this.crowdsourcedCounter = { Event: 0, Creator: 0, Image: 0 }
    this.countedIds = []
    this.ensureLocalStorage()
    this.loadFromLocalStorage()
  }

  getCrowdSourcedHashes () {
    return this.localStorageObj.crowdSourcedHashes
  }

  appendCrowdSourcedHashes (value) {
    this.localStorageObj.crowdSourcedHashes = value.concat(this.localStorageObj.crowdSourcedHashes)
    const length = this.localStorageObj.crowdSourcedHashes.length
    if (length > this.MAX_HASH_CACHE) this.localStorageObj.crowdSourcedHashes.splice(length - this.ON_MAX_REDUCE, this.ON_MAX_REDUCE)
    chrome.storage.local.set({ crowdSourcedHashes: this.localStorageObj.crowdSourcedHashes })
  }

  getCrowdsourcedCounter () {
    return this.crowdsourcedCounter
  }

  updateCrowdsourcedCounter (type, id) {
    if (!this.countedIds.includes(id)) {
      this.countedIds.push(id)
      this.crowdsourcedCounter[type] = this.crowdsourcedCounter[type] + 1
      chrome.storage.local.set({ crowdsourcedCounter: JSON.stringify(this.crowdsourcedCounter) })
    }
  }

  findTimezoneMap (key) {
    return this.timezoneMap[key]
  }

  appendTimezoneMap (key, timezone) {
    if (!this.timezoneMap[key]) {
      this.timezoneMap[key] = timezone
      chrome.storage.local.set({ timezoneMap: JSON.stringify(this.timezoneMap) })
    }
  }

  ifPrivacyPolicyAccepted (f) {
    chrome.storage.local.get(["privacypolicyaccept"], storage => {
      if (storage.privacypolicyaccept) f()
    })
  }

  ifDebugOn (f) {
    chrome.storage.local.get(["debug"], storage => {
      if (storage.debug) f()
    })
  }

  ifDebugOff (f) {
    chrome.storage.local.get(["debug"], storage => {
      if (!storage.debug) f()
    })
  }

  loadFromLocalStorage () {
    chrome.storage.local.get(null, storage => {
      this.localStorageObj = storage
      if (!this.localStorageObj.crowdSourcedHashes) this.localStorageObj.crowdSourcedHashes = []
      if (storage.timezoneMap) this.timezoneMap = JSON.parse(storage.timezoneMap)
      if (storage.crowdsourcedCounter) this.crowdsourcedCounter = JSON.parse(storage.crowdsourcedCounter)
    })
  }

  ensureLocalStorage () {
    chrome.storage.local.get(null, function (storageResult) {
      if (!storageResult.puncher_id) {
        chrome.storage.local.set({
          puncher_id: (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
          endpoint: "http://zuckerpunch-app.northeurope.azurecontainer.io:3000/event",
          endpoint_type: "zuckerpunch"
        })
      }
    })
  }
}
