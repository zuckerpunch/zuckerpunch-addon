/* global DocumentStorage, BlobStorage, SettingsStorage, Parser, ParseEvent, ParseCreator, ParseTimezone, ParseImage, ParseTimePopup, Queue, App, ForegroundListener, Sniffer, CrowdSourcer */
"use strict"

const _documentStorage = new DocumentStorage()
const _blobStorage = new BlobStorage()
const _settingsStorage = new SettingsStorage()

const _parser = new Parser([
  new ParseEvent(),
  new ParseCreator(),
  //  new ParseTimezone(),
  new ParseImage(),
  new ParseTimePopup()
], _documentStorage, _blobStorage, _settingsStorage)

const _queue = new Queue(_settingsStorage, _parser.getIdentifyingPropertyNames())
const _crowdSourcer = new CrowdSourcer(_documentStorage, _blobStorage, _settingsStorage)

const _app = new App(_queue, _parser, _documentStorage, _blobStorage, _settingsStorage, _crowdSourcer)
const _foregroundListener = new ForegroundListener(_queue, _documentStorage, App.parseQueue, _settingsStorage)
const _sniffer = new Sniffer(_queue, _settingsStorage)

_app.start()
_foregroundListener.start()
_sniffer.start()

console.log("*** ZUCKERPUNCH ADDON BACKGROUND LOADED AND LISTENING ***")
