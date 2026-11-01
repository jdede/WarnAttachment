// Jens Dede, 2026

// workaround as browser seems to be broken in here
const browser = window.browser.extension.getBackgroundPage().browser;
var timeoutTimer = -1; // event id for timeout, required to cancel timer

const ENTRY_RE = /^[A-Z0-9-]+$/;

// The hidden textareas keep the lists as "A,B,C". The tag editors are only a
// different view on these values.
const TAG_EDITORS = [
    { list: "warnattachment-warning",  box: "warn-tags",  input: "warn-input",  count: "warn-count" },
    { list: "warnattachment-blocking", box: "block-tags", input: "block-input", count: "block-count" }
];

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

    const tags = entries.map(ext => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = ext;

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

    const prefs = {
        warn : uniqueList(document.querySelector("#warnattachment-warning").value).join(","),
        blocked : uniqueList(document.querySelector("#warnattachment-blocking").value).join(","),
        user_warning_msg : document.querySelector("#warnattachment-user-warn-message").value.trim(),
        user_blocked_msg : document.querySelector("#warnattachment-user-blocked-message").value.trim()
    }
    await browser.storage.local.set(prefs);
    markDirty(false);

    if (e !== undefined) {
        showMessage(browser.i18n.getMessage("options.notification.savedone"));
    }
}

async function restoreOptions() {
    const defaults = window.browser.extension.getBackgroundPage().warnAttachmentDefaultValues;
    const s = await browser.storage.local.get(defaults);
    document.querySelector("#warnattachment-warning").value = s.warn;
    document.querySelector("#warnattachment-blocking").value = s.blocked;
    document.querySelector("#warnattachment-user-warn-message").value = s.user_warning_msg;
    document.querySelector("#warnattachment-user-blocked-message").value = s.user_blocked_msg;
    renderAllTags();
    markDirty(false);
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
    document.querySelector("#warnattachment-warning").value = browser.i18n.getMessage("warningMessageTypes");
    document.querySelector("#warnattachment-blocking").value = browser.i18n.getMessage("blockingMessageTypes");
    document.querySelector("#warnattachment-user-warn-message").value = "";
    document.querySelector("#warnattachment-user-blocked-message").value = "";
    TAG_EDITORS.forEach(ed => { document.getElementById(ed.input).value = ""; });
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
document.querySelectorAll("#warnattachment-user-warn-message, #warnattachment-user-blocked-message")
    .forEach(el => el.addEventListener("input", () => markDirty(true)));
