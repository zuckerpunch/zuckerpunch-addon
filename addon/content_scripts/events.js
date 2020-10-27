/* global chrome, ObjUtils */
"use strict"

class ScrapeEvent {
  constructor () {
    this.lastCheckUrl = null
    ScrapeEvent.pageUrl = null
    ScrapeEvent.viewed_event_id = null
  }

  static parseJsonFromDOM () {
    // finding canonical id:
    const thisTimeLinks = [].filter.call(document.getElementsByTagName("a"), a => a.href.includes("event_time_id=" + ScrapeEvent.viewed_event_id))
    thisTimeLinks.forEach(a => {
      ScrapeEvent.pageUrl = a.href
      ScrapeEvent.viewed_event_id = ((new URL(ScrapeEvent.pageUrl)).pathname.match(/([0-9]{10,})/) || [ScrapeEvent.viewed_event_id])[0]
    })

    document.querySelectorAll('script[type="application/json"]').forEach((entry) => {
      chrome.runtime.sendMessage({ url: ScrapeEvent.pageUrl, jsonRaw: entry.innerText })
    })
    document.querySelectorAll('script[type="application/ld+json"]').forEach((entry) => {
      chrome.runtime.sendMessage({ url: ScrapeEvent.pageUrl, jsonRaw: entry.innerText })
    })

    var reg = /(?:\(|>|[^"],)({".*?("|)}+)(?:\)|<)/g
    const innerHTML = document.documentElement.innerHTML
    var result
    while ((result = reg.exec(innerHTML)) !== null) {
      if (result.length > 0 && result[0].includes("\"data\":")) {
        const embeddedjson = result[1]
        try {
          const json = JSON.parse(embeddedjson)
          const found = ObjUtils.findObjectByPropertyName(json, "data")
          found.forEach(e => {
            const parentInfo = ObjUtils.findObjectByPropertyName(e, "parent_if_exists_or_self").find(f => true)
            if (parentInfo) {
              ScrapeEvent.viewed_event_id = parentInfo.id
            }
            chrome.runtime.sendMessage({ url: ScrapeEvent.pageUrl, jsonRaw: JSON.stringify({ data: e }) })
          })
        } catch (e) {
          chrome.storage.local.get("debug", settings => {
            if (settings.debug) {
              console.warn("Zuckerpunch failed to parse embedded JSON:")
              console.warn(embeddedjson)
              console.warn(e)
            }
          })
        }
      }
    }
  }

  static parseFromEventDOM () {
    const times = []

    const tagLinks = [].filter.call(document.getElementsByTagName("a"), a => a.href && a.href.includes("events/discovery") && a.href.includes("suggestion_token"))
    const tags = []

    tagLinks.forEach(function (elem) {
      const tagLinkParams = new URLSearchParams(elem.href.split("?")[1])
      const tagToken = JSON.parse(tagLinkParams.get("suggestion_token"))
      Object.getOwnPropertyNames(tagToken).forEach(tokenName => {
        if (tagToken[tokenName] && tagToken[tokenName].length > 0 && !tags.some(t => t.tag_id === tagToken[tokenName][0])) {
          tags.push({
            event_id: ScrapeEvent.viewed_event_id,
            text: elem.innerText,
            tag_id: tagToken[tokenName][0].toString(),
            type: tokenName === "tags" ? "tag"
              : tokenName === "event_categories" ? "category"
                : tokenName === "event_flags" ? "flag" : tokenName,
            text_locale: document.documentElement.lang
          })
        }
      })
    })
    if (tags.length > 0) chrome.runtime.sendMessage({ url: ScrapeEvent.pageUrl, jsonRaw: JSON.stringify({ tags: tags }) })

    const topImageElements = [].filter.call(document.getElementsByTagName("img"), img => img.src && img.src.includes("fbcdn.net/v/t1.0-") && img.width > 400)
    const topImageElement = topImageElements.find(i => i.getAttribute("data-imgperflogname")) || topImageElements.find(t => true)
    if (topImageElement) {
      fetch(topImageElement.src, {}) // fetching here get img 'silently' from local cache
        .then(response => response.blob())
        .then(blob => {
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = reject
            reader.onload = () => {
              resolve(reader.result)
            }
            reader.readAsDataURL(blob)
          }).then(imgBase64 => {
            const images = []
            images.push({
              event_id: ScrapeEvent.viewed_event_id,
              src: topImageElement.src,
              base64: imgBase64
            })
            chrome.runtime.sendMessage({ url: ScrapeEvent.pageUrl, jsonRaw: JSON.stringify({ images: images }) })
          })
        }).catch(err => console.warn(err))
    }

    const locationSpans = [].filter.call(document.getElementsByTagName("span"), span => span.style.userSelect === "text" && span.innerText.length > 15 && span.innerText.match(/\d/))
    const locations = []
    locationSpans.forEach(function (elem) {
      locations.push({
        event_id: ScrapeEvent.viewed_event_id,
        freeform: elem.innerText
      })
    })

    const mapImageElements = [].filter.call(document.getElementsByTagName("img"), img => img.src && img.src.includes("/static_map.php?") && img.src.includes("&markers="))
    if (mapImageElements.length > 0) {
      const geocode = (new URL(mapImageElements[0].src)).searchParams.get("markers").split(",")
      locations.push({
        event_id: ScrapeEvent.viewed_event_id,
        gps: {
          latitude: geocode[0],
          longitude: geocode[1]
        }
      })
    }
    if (locations.length > 0) chrome.runtime.sendMessage({ url: ScrapeEvent.pageUrl, jsonRaw: JSON.stringify({ locations: locations }) })

    const timeContentAttribs = [].filter.call(document.getElementsByTagName("div"), div => div.getAttribute("content") && div.getAttribute("content").match(/\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(\+|-)\d\d/))
    timeContentAttribs.forEach(function (elem) {
      times.push({
        event_id: ScrapeEvent.viewed_event_id,
        event_time_id: ScrapeEvent.viewed_event_id,
        date_text: elem.getAttribute("content")
      })
    })
    if (times.length > 0) chrome.runtime.sendMessage({ url: ScrapeEvent.pageUrl, jsonRaw: JSON.stringify({ times: times }) })
  }

  checkPage () {
    if (ScrapeEvent.lastCheckUrl !== document.URL && document.URL.includes("/events")) {
      ScrapeEvent.lastCheckUrl = ScrapeEvent.pageUrl = document.URL
      ScrapeEvent.viewed_event_id = ((new URL(document.URL)).pathname.match(/([0-9]{10,})/) || [null])[0]
      ScrapeEvent.locale = document.documentElement.lang
      window.setTimeout(ScrapeEvent.parseJsonFromDOM, 500)
      if (ScrapeEvent.viewed_event_id) window.setTimeout(ScrapeEvent.parseFromEventDOM, 1500)
    }
  }

  start () {
    window.setInterval(this.checkPage, 1000)
  }
}

const scrapeEvent = new ScrapeEvent()
scrapeEvent.start()
