// WarnAttachment
// Jens Dede, 2026

const warnAttachmentCurrentLegacyMigrationVersion = 3

// File types added in version 2.21 (migration step 3)
const warnAttachmentAddedIn221 = {
    warn: "DOTM,XLTM,XLAM,POTM,PPAM,SLDM,RTF,SVG,SHTML,XHTML,GZ,TGZ,TAR,XZ,ZST,ACE,ARJ,ONE,SH,URL",
    blocked: "PS1,PSM1,PS1XML,VHD,VHDX,MSIX,APPX,APPXBUNDLE,APPINSTALLER,XLL,REG,CAB,SETTINGCONTENT-MS,LIBRARY-MS,SEARCH-MS,IQY,SLK,ACCDE,DESKTOP,COMMAND,APP,DMG,PKG"
}

// Add new extensions to an existing list, keep the user's order and entries
function mergeExtList(current, additions) {
    const list = (current || "").split(",").map(e => e.trim()).filter(e => e);
    const have = new Set(list.map(e => e.toLowerCase()));
    for (const e of additions.split(",")) {
        if (!have.has(e.toLowerCase())) {
            list.push(e);
            have.add(e.toLowerCase());
        }
    }
    return list.join(",");
}

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

// Settings that can be enforced by an administrator, see README:
// policies.json -> "3rdparty" -> "Extensions" -> "warnattachment@jdede.de"
// (key -> expected type of the value in the policy)
const warnAttachmentManagedKeys = {
    warn: "string",
    blocked: "string",
    user_warning_msg: "string",
    user_blocked_msg: "string",
    timeout: "number"
};

// Waiting time (seconds) before "Open anyway" can be clicked
const WARNATTACHMENT_MAX_TIMEOUT = 60;

function sanitizeTimeout(value) {
    const t = Math.round(Number(value));
    if (!Number.isFinite(t)) {
        return warnAttachmentDefaultValues.timeout;
    }
    return Math.min(WARNATTACHMENT_MAX_TIMEOUT, Math.max(0, t));
}

// Read the settings set by the administrator (enterprise policy).
// Returns {} if no policy is set for this add-on.
async function getManagedSettings() {
    let managed;
    try {
        managed = await browser.storage.managed.get();
    } catch (e) {
        // No policy for this add-on (the normal case for private users)
        return {};
    }
    const result = {};
    for (const [key, type] of Object.entries(warnAttachmentManagedKeys)) {
        if (typeof managed[key] === type) {
            result[key] = managed[key];
        } else if (key in managed) {
            console.warn(`WarnAttachment: policy value "${key}" ignored, must be a ${type}`);
        }
    }
    if ("locked" in managed && typeof managed.locked !== "boolean") {
        console.warn('WarnAttachment: policy value "locked" ignored, must be true or false');
    }
    // "locked": true -> the user can not change any setting. Settings not
    // given in the policy use the default values.
    if (managed.locked === true) {
        for (const key of Object.keys(warnAttachmentManagedKeys)) {
            if (!(key in result)) {
                result[key] = warnAttachmentDefaultValues[key];
            }
        }
    }
    return result;
}

// Get the active settings: defaults < user settings < policy.
// Also used by the options page (via getBackgroundPage()).
async function getSettings() {
    const local = await browser.storage.local.get(warnAttachmentDefaultValues);
    const managed = await getManagedSettings();
    const settings = Object.assign({}, local, managed);
    settings.timeout = sanitizeTimeout(settings.timeout);
    return {
        settings: settings,
        managedKeys: Object.keys(managed)
    };
}

// ---------------------------------------------------------------------------
// Dialogs (popup window, see content/dialog/)
// ---------------------------------------------------------------------------

const DIALOG_WIDTH = 480;
const DIALOG_HEIGHT = 260;    // adjusted to the content by the dialog itself

// Open dialogs: id -> {data, resolve, windowId, notBefore}
const openDialogs = new Map();
let dialogCounter = 0;

// Show a dialog and wait for the decision of the user.
// kind: "warn" (returns true if the user wants to open the attachment) or
//       "block" (always returns false)
async function showDialog(kind, title, text, filename, timeout) {
    const id = String(++dialogCounter);
    const data = { kind, title, text, filename, timeout: kind == "warn" ? timeout : 0 };

    const result = new Promise(resolve => {
        openDialogs.set(id, {
            data,
            resolve,
            windowId: null,
            // "Open anyway" is not accepted before the countdown is over
            notBefore: Date.now() + data.timeout * 1000 - 250
        });
    });

    // center the dialog above the current Thunderbird window
    const options = {
        url: browser.runtime.getURL("content/dialog/dialog.html") + "?id=" + id,
        type: "popup",
        width: DIALOG_WIDTH,
        height: DIALOG_HEIGHT,
        allowScriptsToClose: true
    };
    try {
        const parent = await browser.windows.getLastFocused();
        options.left = Math.round(parent.left + (parent.width - DIALOG_WIDTH) / 2);
        options.top = Math.round(parent.top + (parent.height - DIALOG_HEIGHT) / 3);
    } catch (e) {
        // no position: the window manager decides
    }

    try {
        const win = await browser.windows.create(options);
        const entry = openDialogs.get(id);
        if (entry) {
            entry.windowId = win.id;
        }
    } catch (e) {
        // Without dialog we can not ask: do not open the attachment
        console.error("WarnAttachment: could not open the dialog", e);
        finishDialog(id, false);
    }
    return result;
}

function finishDialog(id, open) {
    const entry = openDialogs.get(id);
    if (!entry) {
        return;
    }
    openDialogs.delete(id);
    if (open && Date.now() < entry.notBefore) {
        console.warn("WarnAttachment: dialog answered before the countdown was over");
        open = false;
    }
    entry.resolve(entry.data.kind == "warn" && open === true);
    if (entry.windowId !== null) {
        browser.windows.remove(entry.windowId).catch(() => {});
    }
}

browser.runtime.onMessage.addListener((message, sender) => {
    if (!message || typeof message.id !== "string") {
        return;
    }
    if (message.type == "warnattachment-dialog-init") {
        const entry = openDialogs.get(message.id);
        return Promise.resolve(entry ? entry.data : null);
    }
    if (message.type == "warnattachment-dialog-result") {
        finishDialog(message.id, message.open === true);
        return Promise.resolve(true);
    }
});

// Closing the window (title bar, Alt+F4, ...) means "cancel"
browser.windows.onRemoved.addListener(windowId => {
    for (const [id, entry] of openDialogs) {
        if (entry.windowId === windowId) {
            entry.windowId = null;
            finishDialog(id, false);
        }
    }
});

// Normalize names
function normalizeName(name) {
  return (name || "")
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
     if (currentMigration < 3) {
        const cur = await browser.storage.local.get(warnAttachmentDefaultValues);
        prefs.warn = mergeExtList(prefs.warn ?? cur.warn, warnAttachmentAddedIn221.warn);
        prefs.blocked = mergeExtList(prefs.blocked ?? cur.blocked, warnAttachmentAddedIn221.blocked);
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

  // get the settings (including the ones enforced by a policy)
  const s = (await getSettings()).settings;

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
    console.debug("Extension by MimeType: ", e);
  }

  // get the current file extension
  const displayName = o.displayName ? o.displayName : o.name;
  let attName = normalizeName(displayName);
  let ext = attName.substring(attName.lastIndexOf(".")).toLowerCase();

  // check if a blocked file extension is used
  for (const p of blockedExt) {
      if ("."+p.toLowerCase() == ext.toLowerCase()){
          // blocked -> show message (no need to wait for it)
          showDialog("block", browser.i18n.getMessage("blockingTitle"),
              blockingMessage, displayName, 0).catch(console.error);
          return false;
      }
  }

  // check for warn extension
  for (const p of warnExt) {
      if ("."+p.toLowerCase() == ext.toLowerCase()){
          // show warning, open the file only if the user confirms
          return showDialog("warn", browser.i18n.getMessage("warningTitle"),
              warningMessage, displayName, s.timeout);
      }
  }

  // otherwise: open
  return true;
}

migratePrefs().catch(console.error);
browser.AttachmentHandler.onOpenAttachment.addListener(cb);

