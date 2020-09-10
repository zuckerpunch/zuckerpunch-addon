/* global chrome */
"use strict"

class ScrapeCreator {
  constructor () {
    this.lastCheckUrl = null
  }

  static findCreator () {
    const creator = { email: [], website: [], category: [] }

    creator.pagename = document.URL.replace("/pg/", "/").split("/")[3];

    [].forEach.call(document.getElementsByTagName("meta"), meta => {
      const property = meta.getAttribute("property")
      const content = meta.getAttribute("content")
      if (property === "al:ios:url") creator.id = (content.match(/[0-9]{8,}/) || [null])[0]
      if (property === "og:title") creator.name = content
    })

    if (creator.id) {
      [].forEach.call([].filter.call(document.getElementsByTagName("a"), a => a.href && a.href.startsWith("mailto:")), mailtoAnchor => {
        creator.email.push(mailtoAnchor.innerText)
      });

      [].forEach.call([].filter.call(document.getElementsByTagName("a"), a => a.href && a.rel.includes("noopener") && a.getElementsByTagName("div").length && a.href.startsWith("http") && a.innerText.match(/\w\.\w/)), websiteAnchor => {
        creator.website.push(websiteAnchor.innerText)
      });

      [].forEach.call([].filter.call(document.getElementsByTagName("a"), a => a.href && a.href.match(/\/(pages\/category\/|search\/pages\/\?q=).{1,}/)), categoryAnchor => {
        creator.category.push(categoryAnchor.innerText)
      })
      const creatorJson = JSON.stringify({ creator: creator })
      chrome.runtime.sendMessage({ url: document.URL, jsonRaw: creatorJson })
    }
  }

  checkPage () {
    if (this.lastCheckUrl !== document.URL && document.URL.includes("/about")) {
      this.lastCheckUrl = document.URL
      setTimeout(ScrapeCreator.findCreator, 1500)
    }
  }

  start () {
    window.setInterval(this.checkPage, 1000)
  }
}

const scrapeCreator = new ScrapeCreator()
scrapeCreator.start()
