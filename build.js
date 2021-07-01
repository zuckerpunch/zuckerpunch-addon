const fs = require("fs-extra")
const zipFolder = require("zip-a-folder")
const path = require("path")
const beautify = require("js-beautify").js
const dirSrc = "./addon"
const dirBuild = "./build"
const dirMozilla = dirBuild + "/mozilla"
const dirChrome = dirBuild + "/chrome"

if (!fs.existsSync("addon/utils/purify.min.js")) {
  var purifyJs = fs.readFileSync("node_modules/dompurify/dist/purify.min.js", "UTF-8")
  purifyJs = purifyJs.replace("sourceMappingURL=purify.min.js.map", "") // sourcemap yield crappy log errors when addblock is installed
  fs.writeFileSync("addon/utils/purify.min.js", purifyJs)
}

if (!fs.existsSync("addon/utils/tz.js")) {
  var tzJs = fs.readFileSync("node_modules/tz-lookup/tz.js", "UTF-8")
  tzJs = beautify(tzJs)
  fs.writeFileSync("addon/utils/tz.js", tzJs)
}

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
      fs.move(dirChrome + "/manifest_chrome.json", dirChrome + "/manifest.json").then(() => {
        deleteFilesRecursive(dirChrome, "mozilla").then(() => {
          writeZip(dirChrome, dirBuild + "/chrome.zip")
        })
      })
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
  zipFolder.zipFolder(dir, zipPath, (err) => {
    if (err) {
      console.log("oh no!", err)
    } else {
      console.log(zipPath + " ready")
    }
  })
};
