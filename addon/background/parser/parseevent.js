/* global ObjUtils, DateUtils, tzlookup */
"use strict"

class ParseEvent {
  parseToStorage (json, sourceUrl, documentStorage, blobStorage, settingsStorage) {
    ObjUtils.findObjectByPropertyName(json, "event").forEach(rawEvent => {
      this.processRawEventNode(rawEvent, sourceUrl, documentStorage, settingsStorage)
    })

    if (json["@type"] === "Event") {
      this.processRawEventNode(json, sourceUrl, documentStorage, settingsStorage)
    }

    ObjUtils.CallOnMatch(json, "data.event", rawEvent => {
      this.processRawEventNode(rawEvent, sourceUrl, documentStorage, settingsStorage)
    })

    ObjUtils.CallOnMatch(json, "result.result.data.event|data.node.comet_hovercard_renderer.event", rawEvent => {
      this.processRawEventNode(rawEvent, sourceUrl, documentStorage, settingsStorage)
    })

    ObjUtils.findObjectByPropertyName(json, "upcoming_events").concat(ObjUtils.findObjectByPropertyName(json, "upcomingEvents")).forEach(upcomingEvents => {
      if (upcomingEvents.edges) {
        const creatorId = json.data && json.data.page ? json.data.page.id : null
        upcomingEvents.edges.forEach(eventContainer => {
          const rawEvent = eventContainer.node
          const event = this.processRawEventNode(rawEvent, sourceUrl, documentStorage, settingsStorage)
          if (creatorId && !event.creator_ids.includes(creatorId)) event.creator_ids.push(creatorId)
        })
      }
    })

    ObjUtils.CallOnMatch(json, "data.page.upcomingRecurringEvents.edges|data.page.upcoming_events.edges|data.venue.ownedEvents.edges", (edges) => {
      [].forEach.call(edges, eventContainer => {
        const rawEvent = eventContainer.node
        this.processRawEventNode(rawEvent, sourceUrl, documentStorage, settingsStorage)
      })
    })

    ObjUtils.CallOnMatch(json, "locations", (locations) => {
      [].forEach.call(locations, rawLocation => {
        const event = documentStorage.getForEdit("Event", rawLocation.event_id)
        if (!event.location) event.location = {}

        if (rawLocation.freeform) event.location.freeform = rawLocation.freeform
        if (rawLocation.gps) event.location.gps = rawLocation.gps
      })
    })

    ObjUtils.CallOnMatch(json, "tags", (tags) => {
      [].forEach.call(tags, rawTag => {
        const event = documentStorage.getForEdit("Event", rawTag.event_id)
        this.ensureTag(event, rawTag.tag_id, rawTag.type, rawTag.text, rawTag.text_locale)
      })
    })

    ObjUtils.CallOnMatch(json, "times", (times) => {
      [].forEach.call(times, rawTime => {
        const event = documentStorage.getForEdit("Event", rawTime.event_id)
        this.resolveTimezoneByLocation(event, settingsStorage)
        const parseddate = DateUtils.parseDate(rawTime.date_text, rawTime.time_text, event.timezone)
        if (parseddate.start > 0) {
          const time = this.getTime(event, rawTime.event_time_id)
          this.mergeTimes(time, parseddate)
        }
      })
    })

    ObjUtils.CallOnMatch(json, "data.event.child_events.nodes", (childEvents) => {
      const event = documentStorage.getForEdit("Event", json.data.event.id)
      const utcInfo = json.data.event.tz_display_name
      childEvents.forEach(c => {
        const time = this.getTime(event, c.id)
        time.start = new Date((new Date(c.utc_start_timestamp * 1000)).toUTCString().replace("GMT", utcInfo))
        time.end = new Date((new Date(c.utc_end_timestamp * 1000)).toUTCString().replace("GMT", utcInfo))
      })
    })

    if (json.isDocumentTitle) {
      const event = documentStorage.getForEdit("Event", json.event_id)
      if (!event.name) event.name = json.name
    }
  }

  getIdentifyingPropertyNames () {
    return [
      "event",
      "upcoming_events",
      "upcomingRecurringEvents",
      "ownedEvents",
      "locations",
      "tags",
      "images",
      "times",
      "Event"
    ]
  }

  processRawEventNode (rawEvent, sourceUrl, documentStorage, settingsStorage) {
    const url = new URL(sourceUrl)
    let eventId = rawEvent.parent_event ? rawEvent.parent_event.id
      : rawEvent.parent_if_exists_or_self ? rawEvent.parent_if_exists_or_self.id : rawEvent.id
    eventId = eventId || url.pathname.match(/([0-9]{10,})/)[0]
    const eventTimeId = url.searchParams.get("event_time_id") ||
                        rawEvent.event_time_id_hint ||
                        (rawEvent.url && rawEvent.url.includes(eventId) ? eventId : (url.pathname.match(/([0-9]{10,})/) || [null])[0])

    if (!eventId) console.warn("found no event_id")

    const event = documentStorage.getForEdit("Event", eventId)

    if (rawEvent.name) event.name = rawEvent.name
    if (rawEvent.title) event.name = rawEvent.title
    if (rawEvent.event_buy_ticket_url) event.ticket_url = rawEvent.event_buy_ticket_url
    if (rawEvent.is_canceled) event.canceled = rawEvent.is_canceled
    if (rawEvent.is_event_draft) event._draft = rawEvent.is_event_draft
    if (rawEvent.description) event.description = rawEvent.description.text || rawEvent.description
    if (rawEvent.event_description && rawEvent.event_description.text) event.description = rawEvent.event_description.text
    if (rawEvent.details && rawEvent.details.text) event.description = rawEvent.details.text || rawEvent.details
    if (rawEvent.timezone) event.timezone = rawEvent.timezone
    if (rawEvent.tz_display_name && rawEvent.tz_display_name.includes("/")) event.timezone = rawEvent.tz_display_name
    if (rawEvent.event_creator && !event.creator_ids.includes(rawEvent.event_creator.id)) event.creator_ids.push(rawEvent.event_creator.id)
    if (rawEvent.childEvents) {
      if (rawEvent.childEvents.count === 0 && rawEvent.startTimestampForDisplay) {
        const time = this.getTime(event, eventId)
        this.mergeTimes(time, DateUtils.parseDate(rawEvent.startTimestampForDisplay))
      } else {
        rawEvent.childEvents.edges.forEach(edge => {
          const time = this.getTime(event, edge.node.id)
          this.mergeTimes(time, DateUtils.parseDate(edge.node.currentStartTimestamp))
        })
      }
    }

    if (rawEvent.discovery_categories) {
      rawEvent.discovery_categories.forEach(rawCategory => {
        try {
          const tagLinkParams = (new URL(rawCategory.uri)).searchParams
          const tagToken = JSON.parse(tagLinkParams.get("suggestion_token"))
          this.ensureTag(event, tagToken.event_categories[0].toString(), "category", rawCategory.label, null)
        } catch {
          settingsStorage.ifDebugOn(() => console.warn(`Failed to parse category URI ${rawCategory.uri}`))
        }
      })
    }

    if (rawEvent.event_kind === "PUBLIC_TYPE") event.public = true
    if (rawEvent.event_kind === "PRIVATE_TYPE") event.public = false

    if (rawEvent.event_place && rawEvent.event_place.id && !event.creator_ids.includes(rawEvent.event_place.id)) event.creator_ids.push(rawEvent.event_place.id)

    if (rawEvent.place || rawEvent.event_place) {
      if ((rawEvent.place || rawEvent.event_place).contextual_name) event.location.freeform = (rawEvent.place || rawEvent.event_place).contextual_name
      if ((rawEvent.place || rawEvent.event_place).name) event.location.name = (rawEvent.place || rawEvent.event_place).name
      if ((rawEvent.place || rawEvent.event_place).address && (rawEvent.place || rawEvent.event_place).address.street) event.location.streetAddress = event.location.streetAddress || (rawEvent.place || rawEvent.event_place).address.street
      if ((rawEvent.place || rawEvent.event_place).city) { event.location.city = event.location.city || (rawEvent.place || rawEvent.event_place).city.contextual_name }
      if ((rawEvent.place || rawEvent.event_place).location) event.location.gps = (rawEvent.place || rawEvent.event_place).location
    }

    if (rawEvent.location) {
      if (rawEvent.location["@type"] === "Place") {
        event.location = { name: rawEvent.location.name }
        if (rawEvent.location.address) {
          if (rawEvent.location.address.streetAddress) event.location.streetAddress = rawEvent.location.address.streetAddress
          if (rawEvent.location.address.postalCode) event.location.zip = rawEvent.location.address.postalCode
          event.location.city = rawEvent.location.address.addressLocality || rawEvent.location.address.city.cityContextualName
          if (rawEvent.location.address.addressCountry) event.location.country = rawEvent.location.address.addressCountry
        }
      } else if (rawEvent.location.includes("·")) {
        event.location = { name: rawEvent.location.substr(0, rawEvent.location.lastIndexOf("·")).trim() }
      }
    }
    this.resolveTimezoneByLocation(event, settingsStorage)
    if (rawEvent.day_time_sentence) {
      const time = this.getTime(event, eventTimeId)
      this.mergeTimes(time, DateUtils.parseDate(rawEvent.day_time_sentence, "", event.timezone))
    }
    if (eventTimeId && rawEvent.startDate) {
      const time = this.getTime(event, eventTimeId)
      this.mergeTimes(time, DateUtils.parseDate(rawEvent.startDate))
    }

    return event
  }

  resolveTimezoneByLocation (event, settingsStorage) {
    if (!event.timezone && event.location.gps) {
      event.timezone = tzlookup(event.location.gps.latitude, event.location.gps.longitude)
    }
    if (event.location && event.location.city) {
      const key = event.location.city + "|" + event.location.country

      const timezone = settingsStorage.findTimezoneMap(key)
      if (event.timezone && !timezone) {
        settingsStorage.appendTimezoneMap(key, event.timezone)
      }
      if (!event.timezone && timezone) event.timezone = timezone
    }
  }

  getTime (event, timeId) {
    if (!timeId) return {}
    return event.times.find(t => t.time_id === timeId) || event.times[event.times.push({ start: null, end: null, time_id: timeId }) - 1]
  }

  ensureImage (event, imageId, _tmpurl, focus, documentStorage) {
    event.images[imageId] = `${event.id}-${imageId}`
    const image = documentStorage.getForEdit("Image", event.images[imageId])
    image._tmpurl = _tmpurl
    if (focus) image.focus = focus
  }

  ensureTag (event, tagId, type, text, textLocale) {
    let tag = event.tags.find(t => t.tag_id === tagId)
    if (!tag) {
      tag = { tag_id: tagId }
      event.tags.push(tag)
    }
    tag.type = type
    tag.text = text
    tag.text_locale = textLocale || tag.text_locale
  }

  mergeTimes (a, b) {
    // the following if is kept around for qa
    if ((a.start && b.start && a.start.getTime() !== b.start.getTime()) || (a.end && b.end && a.end.getTime() !== b.end.getTime())) console.error("Picked up inconsistent dates for the same event", a, b)

    if (!a.start) a.start = b.start
    if (!a.end) a.end = b.end
  }
}
