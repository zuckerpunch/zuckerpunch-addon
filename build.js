const fs = require("fs-extra")
const zipFolder = require("zip-folder")
const path = require("path")
const dirSrc = "./addon"
const dirBuild = "./build"
const dirMozilla = dirBuild + "/mozilla"
const dirChrome = dirBuild + "/chrome"

fs.copySync("node_modules/dompurify/dist/purify.min.js", "addon/utils/purify.min.js")

console.log("building to " + dirBuild)

fs.removeSync(dirBuild)

fs.ensureDir(dirBuild).then(() => {
  fs.ensureDir(dirMozilla).then(() => {
    fs.copy(dirSrc, dirMozilla).then(() => {
      fs.move(dirMozilla + "/manifest_mozilla.json", dirMozilla + "/manifest.json").then(() => {
        deleteFilesRecursive(dirMozilla, "chrome").then(() => {
          writeZip(dirMozilla, dirBuild + "/mozilla.zip")
        })
      })
    })
  })

  fs.ensureDir(dirChrome).then(() => {
    fs.copy(dirSrc, dirChrome).then(() => {
      fs.move(dirChrome + "/manifest_chrome.json", dirChrome + "/manifest.json")
      deleteFilesRecursive(dirChrome, "mozilla")
    })
  })
})

function deleteFilesRecursive (directory, deleteWhenInFilename) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, { withFileTypes: true }, (err, files) => {
      if (err) throw err
      var promises = []

      files.filter(f => !f.isDirectory() && f.name.includes(deleteWhenInFilename)).forEach(file => {
        promises.push(new Promise((resolve, reject) => {
          fs.unlink(path.join(directory, file.name), err => {
            if (err) reject(err)
            resolve()
          })
        }))
      })

      files.filter(f => f.isDirectory()).forEach(dir => {
        promises.push(deleteFilesRecursive(path.join(directory, dir.name), deleteWhenInFilename))
      })
      Promise.all(promises).then(() => resolve())
    })
  })
}

function writeZip (dir, zipPath) {
  zipFolder(dir, zipPath, (err) => {
    if (err) {
      console.log("oh no!", err)
    } else {
      console.log("EXCELLENT - ZIPPED")
    }
  })
};
