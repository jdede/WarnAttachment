/**
 * warnAttachment.js
 *
 * Overwrite the attachment handler to warn against dangerous file extensions
 * and block the most harmful ones.
 *
 * Jens Dede, 2017
 *
 */

var openAttachmentOriginal;


if (
    window.location.href == "chrome://messenger/content/messenger.xul" ||
    window.location.href == "chrome://messenger/content/messageWindow.xul"
) {

    openAttachmentOriginal = AttachmentInfo.prototype.open;
    var openAttachment = function(attachment) {

        attachment = this;

        // Translation
        var stringsBundle = document.getElementById("warnAttachmentStringbundle");

        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch("extensions.warnattachment.");

        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Components.interfaces.nsIPromptService);
        var blockedExt = prefs.getCharPref("blocked").toLowerCase().replace(/\s+/g, '').split(",");
        var warnExt = prefs. getCharPref("warn").toLowerCase().replace(/\s+/g, '').split(",");

        // Get extension of current opened file
        var attName = attachment.displayName ? attachment.displayName : attachment.name;
        var ext = attName.substring(attName.lastIndexOf(".")).toLowerCase();

        // Blocked?
        for (var i = 0; i<blockedExt.length; i++){
            if ("." + blockedExt[i].toLowerCase() == ext) {
                prompts.alert(null,
                    stringsBundle.getString('blockTitle'),
                    stringsBundle.getString('blockText')
                );
                // Do nothing
                return;
            }
        }

        // Warn?
        for (var i = 0; i<warnExt.length; i++){
            if ("." + warnExt[i].toLowerCase() == ext){
                var result = prompts.confirm(null,
                    stringsBundle.getString('warningTitle'),
                    stringsBundle.getString('warningText')
                );
                if(result){
                    // User agreed: Open normally
                    openAttachmentOriginal.apply(this,arguments);
                }
                return;
            }
        }
        // Not an dangerous extension: Open normally
        openAttachmentOriginal.apply(this, arguments);
    };
    AttachmentInfo.prototype.open = openAttachment;
}

