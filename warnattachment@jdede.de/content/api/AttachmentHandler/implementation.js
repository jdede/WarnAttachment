// Experimental API: Allows to register a callback to the attachment opener

var { ExtensionCommon } = ChromeUtils.importESModule("resource://gre/modules/ExtensionCommon.sys.mjs");
var Services = globalThis.Services || ChromeUtils.importESModule(
  "resource://gre/modules/Services.sys.mjs"
).Services;
const LISTENER_NAME = "warnattachmentExperimentListener_";

// Before bug 1696777, AttachmentInfo has been global variable, but
// the patch moved it into a system module.
var ModuleAttachmentInfo = null;
var ModuleOriginalOpener = null;
try {
  ModuleAttachmentInfo = ChromeUtils.importESModule(
    "resource:///modules/AttachmentInfo.sys.mjs"
  ).AttachmentInfo;
  ModuleOriginalOpener = ModuleAttachmentInfo.prototype.open;
} catch (e) {
}

function log(msg){
  Services.console.logStringMessage(msg);
}


var AttachmentHandler = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      AttachmentHandler: {
        onOpenAttachment : new ExtensionCommon.EventManager({
            context,
            name: "AttachmentHandler.onOpenAttachment",
            register(fire){
                function callback(attachment){
                    return fire.async(attachment);
                }

                // If AttachmentInfo is in the system module, override the
                // open method here.
                if (ModuleAttachmentInfo) {
                  ModuleAttachmentInfo.prototype.open = async function(browsingContext) {
                    callback({
                      contentType : this.contentType,
                      url : this.url,
                      uri : this.uri,
                      name : this.name,
                      displayName : this.displayName
                    }).then(result => {
                      if (result) {
                        // Call original handler
                        ModuleOriginalOpener.call(this, browsingContext);
                      } else {
                        // File blocked. Do nothing
                      }
                    });
                  }

                  return function() {
                    ModuleAttachmentInfo.prototype.open = ModuleOriginalOpener;
                  };
                }

                // Otherwise override the open method for each window.
                windowListener.add(callback);
                return function() {
                    windowListener.remove();
                };
            },
        }).api()
      }
    }
  }
};



// (This file had a lowercase E in Thunderbird 65 and earlier.)
var { ExtensionSupport } = ChromeUtils.importESModule("resource:///modules/ExtensionSupport.sys.mjs");

var windowListener = new class extends ExtensionCommon.EventEmitter {

  constructor() {
    super();
    this.callbackCount = 0;
    this.callback = undefined;
  }

  add(callback) {
    this.callbackCount++;

    if (this.callbackCount == 1) {
      this.callback = callback;
      ExtensionSupport.registerWindowListener(LISTENER_NAME, {
        chromeURLs: [
          "chrome://messenger/content/messenger.xhtml",
          "chrome://messenger/content/messenger.xul",
          "chrome://messenger/content/messageWindow.xul",
          "chrome://messenger/content/messageWindow.xhtml",
        ],
        onLoadWindow: function(window) {
          window.originalOpener = window.AttachmentInfo.prototype.open;
          window.AttachmentInfo.prototype.open = async function() {
              windowListener.callback({
                  contentType : this.contentType,
                  url : this.url,
                  uri : this.uri,
                  name : this.name,
                  displayName : this.displayName
              }).then(result => {
                  if (result) {
                      // Call original handler
                      window.originalOpener.apply(this);
                  } else {
                      // File blocked. Do nothing
                  }
              });
          }
        },
      });
    }
  }

  remove() {
    this.callbackCount--;

    if (this.callbackCount == 0) {
      for (let window of ExtensionSupport.openWindows) {
        if ([
          "chrome://messenger/content/messenger.xhtml",
          "chrome://messenger/content/messenger.xul",
          "chrome://messenger/content/messageWindow.xul",
          "chrome://messenger/content/messageWindow.xhtml",
        ].includes(window.location.href)) {
          window.AttachmentInfo.prototype.open = window.originalOpener;
        }
      }
      ExtensionSupport.unregisterWindowListener(LISTENER_NAME);
      this.callback = undefined;
    }
  }
};



