// Jens Dede, 2020

// workaround as browser seems to be broken in here
const browser = window.browser.extension.getBackgroundPage().browser;


// Callback: called if the settings from the option page should be saved *
function saveOptions(e) {
    prefs = {
        warn : document.querySelector("#warnattachment-warning").value,
        blocked : document.querySelector("#warnattachment-blocking").value,
        user_warning_msg : document.querySelector("#warnattachment-user-warn-message").value,
        user_blocked_msg : document.querySelector("#warnattachment-user-blocked-message").value
    }
    browser.storage.local.set(prefs);

  e.preventDefault();
}

// Get the options from the storage backend and fill the form
function restoreOptions() {
  browser.storage.local.get("warn").then(p => {document.querySelector("#warnattachment-warning").value = p.warn;});
  browser.storage.local.get("blocked").then(p => {document.querySelector("#warnattachment-blocking").value = p.blocked;});
  browser.storage.local.get("user_warning_msg").then(p => {document.querySelector("#warnattachment-user-warn-message").value = p.user_warning_msg;});
  browser.storage.local.get("user_blocked_msg").then(p => {document.querySelector("#warnattachment-user-blocked-message").value = p.user_blocked_msg;});
}

// Get the translations if available
function translate(){
    document.querySelectorAll('*[i18n-text]').forEach(e => {
        e.textContent = browser.i18n.getMessage(e.getAttribute("i18n-text"));
    })
    document.querySelectorAll('*[i18n-value]').forEach(e => {
        e.value = browser.i18n.getMessage(e.getAttribute("i18n-value"));
    })
    document.querySelectorAll('*[i18n-placeholder]').forEach(e => {
        e.placeholder = browser.i18n.getMessage(e.getAttribute("i18n-placeholder"));
    })
}

// Callback: Do the startup stuff: translate and get options from storage
function startup() {
    translate();
    restoreOptions();
}

// events
document.addEventListener('DOMContentLoaded', startup);
document.querySelector("form").addEventListener("submit", saveOptions);
