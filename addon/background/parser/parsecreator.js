/* global ObjUtils */
"use strict"

class ParseCreator {
  parseToStorage (json, sourceUrl, documentStorage) {
    ObjUtils.CallOnMatch(json, "creator", (rawCreator) => {
      const creator = documentStorage.getForEdit("Creator", rawCreator.id)
      if (rawCreator.name) creator.name = rawCreator.name
      if (rawCreator.pagename) creator.pagename = rawCreator.pagename
      rawCreator.website.forEach(website => { if (!creator.website.includes(website)) creator.website.push(website) })
      rawCreator.email.forEach(email => { if (!creator.email.includes(email)) creator.email.push(email) })
      rawCreator.category.forEach(category => { if (!creator.category.includes(category)) creator.category.push(category) })
    })

    ObjUtils.CallOnMatch(json, "data.venue", (rawCreator) => {
      const creator = documentStorage.getForEdit("Creator", rawCreator.id)
      if (rawCreator.name) creator.name = rawCreator.name
      if (rawCreator.category && !creator.category.includes(rawCreator.category)) creator.category.push(rawCreator.category)
      if (rawCreator.href) creator.pagename = rawCreator.href.replace("/pg/", "/").split("/")[3]
    })

    ObjUtils.CallOnMatch(json, "data.page.comet_page_about_tab.page.page_about_sections.page", (rawCreator) => {
      const creator = documentStorage.getForEdit("Creator", rawCreator.id)
      creator.pagename = creator.pagename || (sourceUrl.includes("/about/") || sourceUrl.includes("/events/")) ? sourceUrl.replace("/pg/", "/").split("/")[3] : null
      creator.name = rawCreator.name
      if (rawCreator.page_about_fields) {
        if (rawCreator.page_about_fields.email && !creator.email.includes(rawCreator.page_about_fields.email.text)) creator.email.push(rawCreator.page_about_fields.email.text)
        if (rawCreator.page_about_fields.website && !creator.website.includes(rawCreator.page_about_fields.website)) creator.website.push(rawCreator.page_about_fields.website)
        if (rawCreator.page_about_fields.page_categories) {
          rawCreator.page_about_fields.page_categories.forEach(c => {
            if (!creator.category.includes(c.text)) creator.category.push(c.text)
          })
        }
        if (rawCreator.page_about_fields.address && rawCreator.page_about_fields.address.full_address) creator.address = rawCreator.page_about_fields.address.full_address
        if (rawCreator.page_about_fields.latitude) creator.latitude = rawCreator.page_about_fields.latitude
        if (rawCreator.page_about_fields.longitude) creator.longitude = rawCreator.page_about_fields.longitude
      }
    })

    if (json.data && json.data.page_id && json.data.event_data && json.data.event_data.website_url) {
      const creator = documentStorage.getForEdit("Creator", json.data.page_id)
      if (!creator.website.includes(json.data.event_data.website_url)) creator.website.push(json.data.event_data.website_url)
    }
  }

  getIdentifyingPropertyNames () {
    return [
      "creator",
      "venue",
      "page_about_sections",
      "event_data"
    ]
  }
}
