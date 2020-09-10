/* global chrome */
"use strict"

class DateUtils {
  static getUtcOffset (d, timeZone) {
    const zones = Array.from({ length: 24 }, (_, i) => ({ diff: i - 12 }))
    for (var index in zones) {
      const d2 = new Date(d)
      const zone = zones[index]
      d2.setHours(d.getHours() + zone.diff)
      if (d.toLocaleString("en-US", { timeZone: timeZone }) === d2.toLocaleString("en-US", { timeZone: "Etc/UTC" })) {
        if (index > 0) {
          zones.splice(index, 1)
          zones.unshift(zone)
        }
        return zone.diff
      }
    }
    return null
  }

  static tryGetUtcString (timeString) {
    if (!timeString) return null

    if (timeString.match(/\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(\+|-)\d\d/)) { return "UTC".concat(timeString.split("T")[1].match(/(\+|-)\d\d\d?\d?/)[0]) }

    const timezones = { UTC: "+00", EDT: "-04", EST: "-05", CDT: "-05", CST: "-06", MDT: "-06", MST: "-7", PDT: "-07", PST: "-08", ADT: "-08", AKDT: "-08", AKST: "-09", AST: "-09", HDT: "-09" }
    for (var index in timezones) {
      if (timeString.endsWith(index)) { timeString = timeString.replace(" " + index, " UTC".concat(timezones[index])) }
    }

    return (timeString.match(/(UTC(\+|-)[0-1]?[0-9])/g) || [null])[0]
  }

  static parseDate (dateString, timeString, timezone) {
    const time = {}

    if (!isNaN(dateString)) {
      time.start = new Date(dateString * 1000)
    } else {
      const isoMatches = dateString.match(/\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(\+|-)\d\d:?\d\d/g)
      if (isoMatches) {
        time.start = new Date(Date.parse(isoMatches[0]))
        if (isoMatches.length === 2) time.end = new Date(Date.parse(isoMatches[1]))
      } else {
        const utcString = DateUtils.tryGetUtcString(timeString) || DateUtils.tryGetUtcString(dateString) || ""
        timeString = timeString.replace("अपराह्न", "PM")
        dateString = dateString.replace("अपराह्न", "PM")
        const hourMatches = timeString.match(/([0-2]?[0-9](:|\.)[0-5][0-9](.[AP][M])?)/g) || dateString.match(/([0-2]?[0-9](:|\.)[0-5][0-9](.[AP][M])?)/g)

        let startDateString = dateString; let endDateString = dateString
        if (hourMatches && hourMatches.length === 2 && dateString.includes(" – ")) {
          startDateString = dateString.split(" – ")[0]
          endDateString = dateString.split(" – ")[1]
        }

        if (hourMatches) {
          time.start = DateUtils.intlDateParse(startDateString, hourMatches[0], utcString, timezone)
          if (hourMatches.length > 1) { time.end = DateUtils.intlDateParse(endDateString, hourMatches[1], utcString, timezone) }
          if (time.end < time.start) time.end = new Date(time.end.getTime() + 60 * 60 * 24 * 1000)
        }
      }
    }

    if (time.start == null) time.unparsed = { date: dateString, time: timeString, timezone: timezone }
    if (time.start && time.unparsed) delete time.unparsed

    return time
  }

  static intlDateParse (dateString, timeString, utcString, timezone) {
    if (!utcString && !timezone) { return null }

    const monthMap = [
    // en         cn/jp   es         fr          de          pt          uk          ru         sv          da        da-short    nb          pl            he        hi
      "January    1月     enero      janvier     Januar      janeiro     січня       января     januari     januar    JAN.        januar      stycznia      בינואר    जनवरी       ",
      "February   2月     febrero    février     Februar     fevereiro   лютого      февраля    februari    februar   FEB.        februar     lutego        בפברואר   फ़रवरी      ",
      "March      3月     marzo      mars        März        março       березня     марта      mars        marts     MAR.        mars        marca         במרץ      मार्च       ",
      "April      4月     abril      avril       April       abril       квітня      апреля     april       april     APR.        april       kwietnia      באפריל    अप्रैल      ",
      "May        5月     mayo       mai         Mai         maio        травня      мая        maj         maj       MAJ         mai         maja          במאי      मई          ",
      "June       6月     junio      juin        Juni        junho       червня      июня       juni        juni      JUN.        juni        czerwca       ביולי     जून         ",
      "July       7月     julio      juillet     Juli        julho       липня       июля       juli        juli      JUL.        juli        lipca         ביולי     जुलाई       ",
      "August     8月     agosto     août        August      agosto      серпня      августа    augusti     august    AUG.        august      sierpnia      באוגוסט   अगस्त       ",
      "September  9月     septiembr  septembre   September   setembro    вересня     сентября   september   september SEP.        september   września      בספטמבר   सितंबर      ",
      "October    10月    octubre    octobre     Oktober     outubro     жовтня      октября    oktober     oktober   OKT.        oktober     października  באוקטובר  अक्तूबर     ",
      "November   11月    noviembre  novembre    November    novembro    листопада   ноября     november    november  NOV.        november    listopada     בנובמבר   नवंबर       ",
      "December   12月    diciembre  décembre    Dezember    dezembro    грудня      декабря    december    december  DEC.        desember    grudnia       בדצמבר    दिसंबर      "]

    let m = null
    for (var monthIdx = 11; monthIdx > -1 && !m; monthIdx--) {
      const matches = monthMap[monthIdx].split(/\s+/g).filter(n => n.length > 0)
      matches.forEach((match) => {
        if (dateString.toLowerCase().includes(" " + match.toLowerCase() + " ") || dateString.startsWith(match + " ") || (match.match(/\d/) && dateString.includes(match))) {
          m = monthIdx + 1
          dateString = dateString.replace(match, "")
        }
      })
    }

    const y = (dateString.match(/20\d\d/g) || [new Date().getFullYear()])[0]
    const d = (dateString.replace(y, "").match(/\d+/g).filter(s => s.length < 3) || [null])[0]

    if (m && d && y) {
      const dateVariantA = `${y}-${(m > 9 ? m : "0" + m)}-${(d > 9 ? d : "0" + d)}T${timeString.replace(".", ":")}`
      const dateVariantB = `${m}/${d}/${y} ${timeString}`
      const d1 = new Date(Date.parse(dateVariantA) || Date.parse(dateVariantB))
      const dateParsable = `${y}-${(m > 9 ? m : "0" + m)}-${(d > 9 ? d : "0" + d)}T${(d1.getHours() < 10 ? "0" : "") + d1.getHours()}:${(d1.getMinutes() < 10 ? "0" : "") + d1.getMinutes()}`

      if (!utcString && timezone) {
        const utcDif = DateUtils.getUtcOffset(d1, timezone)
        utcString = (utcDif === null ? utcString : ((utcDif > -1 ? "+" : "-") + (Math.abs(utcDif) < 9 ? "0" : "") + Math.abs(utcDif) + "00"))
      }

      if (utcString) {
        utcString = utcString.replace("UTC", "")
        const formattedDate = `${dateParsable}${utcString + (utcString.length < 4 ? "00" : "")}`
        const date = new Date(Date.parse(formattedDate) * 1)
        return date
      }
    }

    chrome.storage.local.get("debug", settings => {
      if (settings.debug) console.log(`Failed to parse ${dateString} ${timeString} ${utcString} ${timezone}`)
    })

    return null
  }
}
