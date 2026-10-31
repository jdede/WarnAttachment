// WarnAttachment
// Jens Dede, 2026

const warnAttachmentCurrentLegacyMigrationVersion = 2

// We hijack the translation mechanism to have a single point of truth for the
// file extensions. Only defined for the default language: English
// Default settings
const warnAttachmentDefaultValues = {
    timeout: 3,
    warn: browser.i18n.getMessage("warningMessageTypes"),
    blocked : browser.i18n.getMessage("blockingMessageTypes"),
    user_warning_msg: "",
    user_blocked_msg: ""
}

// Normalize names
function normalizeName(name) {
  return name
    .normalize("NFKC")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .trim()
    .replace(/[.\s]+$/, "")
    .toLowerCase();
}

// MIME types that carry no information about the content.
const NEUTRAL_MIME_TYPES = new Set([
    "",
    "application/octet-stream",
    "application/unknown",
    "application/x-unknown",
    "binary/octet-stream"
]);

// Migrate the preferences from old thunderbird versions (if available)
async function migratePrefs() {
    const results = await browser.storage.local.get("migratedLegacy");
    const currentMigration =
        results.migratedLegacy
        ? results.migratedLegacy
        : 0;

    if (currentMigration >= warnAttachmentCurrentLegacyMigrationVersion){
        // Nothing to migrate
        return;
    }

    let prefs = results.preferences || {}

    if (currentMigration < 1) {
        for (const prefName of Object.getOwnPropertyNames(warnAttachmentDefaultValues)){
            prefs[prefName] = await browser.LegacyPrefMigration.getPref(prefName);
            if (prefs[prefName] === undefined) {
                prefs[prefName] = warnAttachmentDefaultValues[prefName];
            }
        }
    }
    prefs.migratedLegacy = warnAttachmentCurrentLegacyMigrationVersion;
    await browser.storage.local.set(prefs);
    console.log("migration done");
}

// Get MIME Type
async function getMimeExtensions(contentType) {
    const type = (contentType || "").split(";")[0].trim().toLowerCase();
    if (NEUTRAL_MIME_TYPES.has(type)) {
        return [];
    }
    try {
        const exts = await browser.AttachmentHandler.getExtensionsForType(type);
        return exts
            .map(e => e.toLowerCase().replace(/^\.+/, ""))
            .filter(e => e.length > 0);
    } catch (e) {
        console.error("WarnAttachment: MIME lookup failed", e);
        return [];
    }
}

// Callback for the opener
async function cb(o){

  // get the settings
  const s = await browser.storage.local.get(warnAttachmentDefaultValues);

  let blockedExt = s.blocked.toLowerCase().replace(/\s+/g, '').split(",");
  let warnExt = s.warn.toLowerCase().replace(/\s+/g, '').split(",");

  let warningMessage = browser.i18n.getMessage("warningText");
  if (s.user_warning_msg != "" && s.user_warning_msg !== undefined){
    warningMessage = s.user_warning_msg;
  }

  let blockingMessage = browser.i18n.getMessage("blockingText");
  if (s.user_blocked_msg != "" && s.user_blocked_msg !== undefined){
    blockingMessage = s.user_blocked_msg;
  }

  // TODO: Check both, the extension and the extension by MIME Type
  for (const e of await getMimeExtensions(o.contentType)) {
    console.log("Extension by MimeType: ", e);
  }

  // get the current file extension
  let attName = normalizeName(o.displayName ? o.displayName : o.name);
  let ext = attName.substring(attName.lastIndexOf(".")).toLowerCase();

  // check if a blocked file extension is used
  for (const p of blockedExt) {
      if ("."+p.toLowerCase() == ext.toLowerCase()){
          // blocked -> show message
          browser.DialogExperiment.getBlockingDialog(
              browser.i18n.getMessage("blockingTitle"),
              blockingMessage
          );
          return false;
      }
  }

  // check for warn extension
  for (const p of warnExt) {
      if ("."+p.toLowerCase() == ext.toLowerCase()){
          // show warning and open file if user marked the checkbox
          return browser.DialogExperiment.getWarningDialog(
              browser.i18n.getMessage("warningTitle"),
              warningMessage,
              browser.i18n.getMessage("warningTextHint")
          );
      }
  }

  // otherwise: open
  return true;
}

migratePrefs().catch(console.error);
browser.AttachmentHandler.onOpenAttachment.addListener(cb);

