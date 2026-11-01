// Jens Dede, 2026

// workaround as browser seems to be broken in here
const browser = window.browser.extension.getBackgroundPage().browser;
var timeoutTimer = -1; // event id for timeout, required to cancel timer

const ENTRY_RE = /^[A-Z0-9-]+$/;

// The hidden textareas keep the lists as "A,B,C". The tag editors are only a
// different view on these values.
const TAG_EDITORS = [
    { key: "warn",    list: "warnattachment-warning",  box: "warn-tags",  input: "warn-input",  count: "warn-count" },
    { key: "blocked", list: "warnattachment-blocking", box: "block-tags", input: "block-input", count: "block-count" }
];

// Simple input fields: user defined messages and the countdown
const FIELDS = {
    user_warning_msg: "warnattachment-user-warn-message",
    user_blocked_msg: "warnattachment-user-blocked-message",
    timeout: "warnattachment-timeout"
};

// Read the value of a field in the format it is stored
function readField(key) {
    const value = document.getElementById(FIELDS[key]).value;
    if (key == "timeout") {
        return window.browser.extension.getBackgroundPage().sanitizeTimeout(value);
    }
    return value.trim();
}

// Settings enforced by the administrator (enterprise policy). They are shown
// read-only and are never written to the local storage.
const managedKeys = new Set();

// Split a list typed or pasted by the user: commas, semicolons, spaces and
// new lines are separators, leading dots are removed
// ("exe, .BAT\ncmd" -> ["EXE", "BAT", "CMD"])
function splitList(str) {
    return (str || "")
        .split(/[\s,;]+/)
        .map(e => e.replace(/^\.+/, "").toUpperCase())
        .filter(e => e.length > 0);
}

function uniqueList(str) {
    return [...new Set(splitList(str))];
}

// Draw the tags of one editor from its hidden textarea
function renderTags(ed) {
    const list = document.getElementById(ed.list);
    const box = document.getElementById(ed.box);
    const input = document.getElementById(ed.input);
    const entries = uniqueList(list.value);
    const readonly = managedKeys.has(ed.key);

    const tags = entries.map(ext => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = ext;
        if (readonly) {
            return tag;
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.title = ext;
        remove.setAttribute("aria-label", "× " + ext);
        remove.addEventListener("click", () => {
            setEntries(ed, entries.filter(e => e != ext));
            input.focus();
        });

        tag.appendChild(remove);
        return tag;
    });

    input.hidden = readonly;
    box.replaceChildren(...tags, input);
    document.getElementById(ed.count).textContent = entries.length;
}

function setEntries(ed, entries) {
    document.getElementById(ed.list).value = entries.join(",");
    renderTags(ed);
    markDirty(true);
}

// Add everything typed into the input field (plus optional pasted text).
// Invalid entries stay in the field and are highlighted.
function commitInput(ed, extra = "") {
    if (managedKeys.has(ed.key)) {
        return;
    }
    const input = document.getElementById(ed.input);
    const added = splitList(input.value + " " + extra);
    if (added.length == 0) {
        return;
    }
    const invalid = added.filter(e => !ENTRY_RE.test(e));
    if (invalid.length > 0) {
        input.value = invalid.join(" ");
        input.classList.remove("error");
        void input.offsetWidth;   // restart the animation
        input.classList.add("error");
        return;
    }
    input.value = "";
    input.classList.remove("error");
    setEntries(ed, [...new Set([...uniqueList(document.getElementById(ed.list).value), ...added])]);
}

function setupTagEditor(ed) {
    const box = document.getElementById(ed.box);
    const input = document.getElementById(ed.input);

    // click into the free space of the box focuses the input
    box.addEventListener("click", e => {
        if (e.target === box) {
            input.focus();
        }
    });

    input.addEventListener("keydown", e => {
        if (e.key == "Enter" || e.key == "," || e.key == " " || e.key == ";") {
            e.preventDefault();      // do not submit the form
            commitInput(ed);
        } else if (e.key == "Backspace" && input.value == "") {
            const entries = uniqueList(document.getElementById(ed.list).value);
            if (entries.length > 0) {
                entries.pop();
                setEntries(ed, entries);
            }
        }
    });
    input.addEventListener("input", () => input.classList.remove("error"));
    input.addEventListener("blur", () => commitInput(ed));

    // pasting a whole list adds all entries at once
    input.addEventListener("paste", e => {
        // (handled here, a single line input would drop the line breaks)
        e.preventDefault();
        commitInput(ed, e.clipboardData.getData("text"));
    });
}

function renderAllTags() {
    TAG_EDITORS.forEach(renderTags);
}

// Highlight the save button if there are unsaved changes
function markDirty(dirty) {
    document.querySelector("input[type=submit]").classList.toggle("dirty", dirty);
}

// Callback: called if the settings from the option page should be saved
async function saveOptions(e) {
    if (e !== undefined) {
        e.preventDefault();
    }
    // take over anything still typed into the tag inputs
    TAG_EDITORS.forEach(ed => commitInput(ed));

    const prefs = {};
    for (const ed of TAG_EDITORS) {
        prefs[ed.key] = uniqueList(document.getElementById(ed.list).value).join(",");
    }
    for (const key of Object.keys(FIELDS)) {
        prefs[key] = readField(key);
    }
    // never store the values enforced by the administrator
    for (const key of managedKeys) {
        delete prefs[key];
    }
    await browser.storage.local.set(prefs);
    markDirty(false);

    if (e !== undefined) {
        showMessage(browser.i18n.getMessage("options.notification.savedone"));
    }
}

async function restoreOptions() {
    const result = await window.browser.extension.getBackgroundPage().getSettings();
    const s = result.settings;
    managedKeys.clear();
    result.managedKeys.forEach(k => managedKeys.add(k));

    for (const ed of TAG_EDITORS) {
        document.getElementById(ed.list).value = s[ed.key];
    }
    for (const [key, id] of Object.entries(FIELDS)) {
        document.getElementById(id).value = s[key];
    }
    showManaged();
    renderAllTags();
    markDirty(false);
}

// Small "set by your administrator" note with a lock icon
function managedNote() {
    const note = document.createElement("span");
    note.className = "managed-note";
    note.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    note.append(browser.i18n.getMessage("options.managed"));
    return note;
}

// Mark the settings enforced by the administrator as read-only
function showManaged() {
    document.querySelectorAll(".managed-note").forEach(n => n.remove());

    for (const ed of TAG_EDITORS) {
        const managed = managedKeys.has(ed.key);
        const box = document.getElementById(ed.box);
        box.classList.toggle("readonly", managed);
        if (managed) {
            box.closest(".card").querySelector(".card-head .count").before(managedNote());
        }
    }
    for (const [key, id] of Object.entries(FIELDS)) {
        const managed = managedKeys.has(key);
        const field = document.getElementById(id);
        field.disabled = managed;
        if (managed) {
            const label = field.closest(".field").querySelector("label");
            if (field.closest(".field-inline")) {
                label.append(" ", managedNote());    // keep the grid layout
            } else {
                label.after(managedNote());
            }
        }
    }

    // nothing left the user could change: hide the buttons
    const allManaged = TAG_EDITORS.every(ed => managedKeys.has(ed.key)) &&
        Object.keys(FIELDS).every(k => managedKeys.has(k));
    document.querySelectorAll(".actions .btn").forEach(b => { b.hidden = allManaged; });
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

// Stack the buttons if they do not fit into one line (depends on the
// length of the translated labels and the width of the window)
function updateActionsLayout() {
    const actions = document.querySelector(".actions");
    actions.classList.remove("stacked");
    const buttons = actions.querySelectorAll(".btn");
    const wrapped = [...buttons].some(b => b.offsetTop != buttons[0].offsetTop);
    actions.classList.toggle("stacked", wrapped);
}

// Callback: Do the startup stuff: translate and get options from storage
function startup() {
    translate();
    updateActionsLayout();
    new ResizeObserver(updateActionsLayout).observe(document.querySelector("form"));
    TAG_EDITORS.forEach(setupTagEditor);
    restoreOptions();
}

async function reset(){
    // only reset the settings the user is allowed to change
    const defaults = window.browser.extension.getBackgroundPage().warnAttachmentDefaultValues;
    for (const ed of TAG_EDITORS) {
        document.getElementById(ed.input).value = "";
        if (!managedKeys.has(ed.key)) {
            document.getElementById(ed.list).value = defaults[ed.key];
        }
    }
    for (const [key, id] of Object.entries(FIELDS)) {
        if (!managedKeys.has(key)) {
            document.getElementById(id).value = defaults[key];
        }
    }
    renderAllTags();
    await saveOptions();
    showMessage(browser.i18n.getMessage("options.notification.resetdone"));
}

function showMessage(msg){
    if (timeoutTimer > 0){
        clearTimeout(timeoutTimer);
    }
    const element = document.querySelector("#infobox");
    element.textContent = msg;
    element.classList.add("show");
    timeoutTimer = setTimeout(function() {
        element.classList.remove("show");
        timeoutTimer = -1;
    }, 3000);
}

// events
document.addEventListener('DOMContentLoaded', startup);
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector("#warnattachment-reset-button").addEventListener("click", reset);
Object.values(FIELDS)
    .forEach(id => document.getElementById(id).addEventListener("input", () => markDirty(true)));
