# Zuckerpunch - events in our hands

Install now on 
- Mozilla Firefox: https://addons.mozilla.org/en-US/firefox/addon/zuckerpunch/
- Google Chrome: https://chrome.google.com/webstore/detail/zuckerpunch-events-in-our/knckllakmdcialablccceieeldjldcpn
- Microsoft Edge: https://chrome.google.com/webstore/detail/zuckerpunch-events-in-our/knckllakmdcialablccceieeldjldcpn 

To build and install the Zuckerpunch add-on: 
- [Build](#how-to-build) 
- [Firefox install](#firefox-install)
- [Chrome install](#chrome-install)
- [Use](#using-zuckerpunch)
- [Version info](#versions)

# About
Zuckerpunch is a Firefox and Chrome add-on which collects JSON from public events as you browse them on Facebook.

The JSON is simple to navigate and export via a toolbar button and, if you have opted in, is sent to a crowdsource service in the background. 

Crowdsourced data is only published with the consent of the copyright holders.

The Zuckerpunch add-on is "passive" and extract event data as you browse it. Facebook cannot detect that you are using this add-on.

#### JSON
The JSON you get will be structured like this:

```json
[
  {
    "@type": "Event",
    "id": "111111111111111",
    "_hash": -491867146,
    "name": "The name of the event.",
    "tags": [
      {
        "tag_id": "333333333333333",
        "type": "category",
        "text": "Revolt",
        "text_locale": "en"
      }
    ],
    "description": "A description\n\nIt Can be really long.",
    "location": {
      "name": "Event Place Name",
      "streetAddress": "1105 Street Address",
      "zip": "1234",
      "city": "The city",
      "country": "IS",
      "latitude": "64.1466238",
      "longitude": "21.9426234"
    },
    "creator_ids": [
      "222222222222222"
    ],
    "ticket_url": "https://some.host/path",
    "times": [
      {
        "start": "2020-08-26T11:00:00.000Z",
        "end": "2020-08-26T14:30:00.000Z",
        "time_id": "454545454545"
      }
    ],
    "timezone": "Atlantic/Reykjavik",
    "images": {
      "large": "111111111111111-large"
    },    
  },
  {
    "@type": "Creator",
    "id": "222222222222222",
    "_hash": -1977376863,
    "name": "Then When New Venue",
    "pagename": "fbpagename",
    "email": [
      "public-contact@the-event-owner.is"
    ],
    "website": [
      "https://some.host/"
    ],
    "category": [
      "Castle",
      "Parc"
    ],
    "address": "Some place, some city"
  },
  {
    "@type": "Image",
    "id": "111111111111111-large",
    "_hash": 691241468,
    "_tmpurl": "https://cdn.fb.com/temp/url?query=query"
  }  
]
```

# how-to-build
First time: Fetch the repo and run `npm install` at the root.

To build run `npm run build` at the root.

If you plan to develop and build automatically, also run `npm run watch`.

# firefox-install
To install the developer version:

Ensure you ran [npm run build](#how-to-build) and then do the following in Firefox:

1. Go to `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on...`
3. Browse to and select `<repo-root>/build/mozilla/manifest.json`

### Optional configuration 
To also enable the add-on when browsing privately, do the following in Firefox:

4. Go to `about:addons`
5. Click on `Zuckerpunch - events in our hands` for add-on details.
6. Select `Allow` for the `Run in Private Windows` option.

If you want to hook up to a custom REST Upsert service or a zuckerpunch service, also do this:

7. Go to the add-on's `Options` tab.
8. Configure the endpoint and save.

# chrome-install
To install the developer version:

Ensure you ran [npm run build](#how-to-build) and then do the following in Chrome:

1. Go to `chrome://extensions/`
2. Click `Load upnacked`
3. Browse to `<repo-root>/build/chrome` and select this folder.

### Optional configuration 
To also enable the add-on when browsing privately, do the following in Chrome:

4. Click `Details` for the Zuckerpunch add-on
5. Browse to and enable `Allow in incognito`

If you want to hook up to your own REST Upsert service or a zuckerpunch service, also do this:

7. browse to and click `Extension options`.
8. Configure the endpoint and save.

# using-zuckerpunch

First browse events on facebook - what you browse is what you will get as JSON.

The JSON is automatically shared with the crowdsourcing service (if you have opted in).

To see and export JSON for browsed events, do this:

1. Click the Zuckerpunch `add-on toolbar button` - the JSON is then shown in a popup.
2. Use the `COPY TO CLIPBOARD` button to export.

# Legality
You will break no law if you use this add-on and use the collected JSON for personal use.

You cannot publish the data you collect without prior consent from the entity that created the event on Facebook. Failing to do so will infringe on their copyright and you become legally liable.

Using the Zuckerpunch add-on is in breach of Facebook's Terms of Service. If you have accepted these terms, using this add-on COULD get your Facebook account banned, but so far this has never happened.

# versions
- 1.0.6: Calling new serverless backend for crowdsourcing, using https.
- 1.0.5: NPM package DOMPurify upgraded to 2.1.1 (security update).
- 1.0.4: Adding counters to icon (number of events in popup) and popup (number of crowdsourced docs to date).
- 1.0.3: Fixes. Parsing relative dates ("tomorrow", "Sunday" etc.). Creator ID now a list.
- 1.0.2: Prepared for Chrome's add-on store (passed).
- 1.0.1: Prepared for Mozilla's add-on store (passed).
- 1.0.0: Works across browsers and fb designs, good data/image sniffing, code refactored and linted.
