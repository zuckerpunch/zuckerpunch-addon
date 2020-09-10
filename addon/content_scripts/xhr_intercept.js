/* global chrome */
"use strict"

class XhrIntercept {
  constructor () {
    XhrIntercept.interceptClassName = "_" + Math.random().toString(36).substr(2, 9)
  }

  static interceptData () {
    var xhrOverrideScript = document.createElement("script")
    xhrOverrideScript.type = "text/javascript"
    xhrOverrideScript.appendChild(document.createTextNode(`
    (function() {
      var XHR = XMLHttpRequest.prototype;
      var send = XHR.send;
      var open = XHR.open;
      XHR.open = function(method, url, async) {
          this.url = url; // the request url
          return open.apply(this, arguments);
      }
      XHR.send = function() {
        if (document.URL.includes("/events") || document.URL.includes("/about") || this.url.includes("event")) {
          this.addEventListener('load', function() {
            if (this.response > "") {
              var dataDOMElement = document.createElement('div');
              dataDOMElement.className = 'CLASS_NAME';
              dataDOMElement.innerText = this.response;
              dataDOMElement.setAttribute("src", this.url);
              dataDOMElement.style.height = 0;
              dataDOMElement.style.overflow = 'hidden';
              document.body.appendChild(dataDOMElement);
            } 
          });
        }
        return send.apply(this, arguments);
      };
    })();
    `.replace("CLASS_NAME", XhrIntercept.interceptClassName)))
    document.head.prepend(xhrOverrideScript)
  }

  static queueIntercepted () {
    Array.prototype.forEach.call(document.getElementsByClassName(XhrIntercept.interceptClassName), (e) => {
      if (e.innerHTML > "") {
        try {
          chrome.runtime.sendMessage({ url: window.location.href, jsonRaw: e.innerHTML })
        } catch (error) {
          console.log(error)
        }
      }
      e.remove()
    })

    requestIdleCallback(XhrIntercept.queueIntercepted)
  }

  static checkForDOM () {
    if (document.head) {
      XhrIntercept.interceptData()
      requestIdleCallback(XhrIntercept.queueIntercepted)
    } else {
      requestIdleCallback(XhrIntercept.checkForDOM)
    }
  }

  start () {
    requestIdleCallback(XhrIntercept.checkForDOM)
  }
}

const xhrIntercept = new XhrIntercept()
xhrIntercept.start()
