/* global DOMPurify */
"use strict"

class ParseTimePopup {
  parseToStorage (json, sourceUrl, documentStorage) {
    if (json.jsmods && json.jsmods.markup) {
      const html = json.jsmods.markup[0][1].__html

      const sanitizedHtml = DOMPurify.sanitize(html.split("&gt;").join(">").replace(/http/g, "#"))

      var doc = document.createElement("html")
      doc.innerHTML = "<html><head><title>dummy</title></head><body>" + sanitizedHtml + "</body></html>"

      const eventLinks = [].filter.call(doc.getElementsByTagName("a"), a => a.href && a.href.includes("/events/"))
      const timeLinks = [].filter.call(doc.getElementsByTagName("a"), a => (a.href && a.href.includes("event_time_id=")) || (a.getAttribute("ajaxify") || "").includes("/events/") || (a.getAttribute("data-hovercard") || "").includes("hovercard.php?id="))

      const times = []
      const eventId = eventLinks.length > 0 ? (eventLinks[0].href.match(/([0-9]{10,})/) || [null])[0] : null
      let date = null

      timeLinks.forEach(function (elem) {
        const url = new URL(elem.href)
        const dateSpan = elem.parentElement.parentElement.parentElement.querySelector("span[title]")
        date = (dateSpan ? dateSpan.title : date)
        times.push({
          event_id: eventId || url.pathname.split("/")[2],
          event_time_id: url.searchParams.get("event_time_id") || ((elem.getAttribute("data-hovercard") || "").match(/([0-9]{10,})/) || [null])[0],
          time_text: elem.textContent,
          date_text: date
        })
      })

      return [{ times: times }]
    }

    return []
  }

  getIdentifyingPropertyNames () {
    return [
      "__html"
    ]
  }
}
