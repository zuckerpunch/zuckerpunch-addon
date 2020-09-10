"use strict"

class App {
  constructor (queue, parser, documentStorage, blobStorage, settingsStorage, crowdSourcer) {
    App.QUEUE_CALM_WAIT_MS = 5000
    App.queue = queue
    App.parser = parser
    App.documentStorage = documentStorage
    App.blobStorage = blobStorage
    App.settingsStorage = settingsStorage
    App.crowdSourcer = crowdSourcer
    App.lastQueueChange = Date.now()
    App.lastCrowdSourcing = Date.now()
  }

  static parseQueue () {
    App.queue.getNew().forEach(qitem => {
      App.parser.parse(qitem.data, qitem.sourceUrl)
      App.lastQueueChange = Date.now()
    })
    App.documentStorage.hashDirty()
  }

  static crowdSource () {
    if (Date.now() - App.lastQueueChange > App.QUEUE_CALM_WAIT_MS || Date.now() - App.lastCrowdSourcing > 10 * App.QUEUE_CALM_WAIT_MS) {
      App.settingsStorage.ifPrivacyPolicyAccepted(() => {
        App.crowdSourcer.publishNew()
        App.lastCrowdSourcing = Date.now()
      })
    }
  }

  start () {
    // main parse / publish pump:
    setInterval(() => {
      App.parseQueue()
      App.crowdSource()
      App.blobStorage.purgeStale()
    }, 1000)
  }
}
