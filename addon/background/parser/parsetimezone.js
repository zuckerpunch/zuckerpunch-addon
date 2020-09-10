"use strict"

class ParseTimezone {
  parseToStorage (json, sourceUrl, documentStorage, blobStorage, settingsStorage) {
    if (json.data && json.data.server_time_data) {
      const timezoneHint = json.data.server_time_data.timezone
      settingsStorage.setTimezoneHint(timezoneHint)
    }
  }

  getIdentifyingPropertyNames () {
    return [
      "server_time_data"
    ]
  }
}
