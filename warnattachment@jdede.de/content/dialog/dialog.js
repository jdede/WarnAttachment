// WarnAttachment: warning / blocking dialog
// Jens Dede, 2026
//
// Opened by background.js as a popup window. The dialog only reports the
// decision of the user; background.js decides whether the attachment is
// opened (and also checks the countdown).

const dialogId = new URLSearchParams(location.search).get("id");
let answered = false;

function msg(key) {
    return browser.i18n.getMessage(key);
}

// Send the decision to the background script and close the window
async function answer(open) {
    if (answered) {
        return;
    }
    answered = true;
    try {
        await browser.runtime.sendMessage({ type: "warnattachment-dialog-result", id: dialogId, open: open });
    } finally {
        window.close();
    }
}

// Disable the open button and show the remaining seconds in its label
function startCountdown(button, label, seconds) {
    if (seconds <= 0) {
        button.textContent = label;
        return;
    }
    let left = seconds;
    button.disabled = true;
    button.textContent = `${label} (${left})`;
    const timer = setInterval(() => {
        left--;
        if (left > 0) {
            button.textContent = `${label} (${left})`;
        } else {
            clearInterval(timer);
            button.textContent = label;
            button.disabled = false;
        }
    }, 1000);
}

// Stack the buttons if they do not fit into one line
function updateActionsLayout() {
    const actions = document.querySelector(".actions");
    actions.classList.remove("stacked");
    const buttons = [...actions.querySelectorAll(".btn:not([hidden])")];
    const wrapped = buttons.some(b => b.offsetTop != buttons[0].offsetTop);
    actions.classList.toggle("stacked", wrapped);
}

// Make the window exactly as high as the content
async function fitWindow() {
    try {
        const win = await browser.windows.getCurrent();
        const chrome = window.outerHeight - window.innerHeight;
        const height = Math.ceil(document.querySelector("main").getBoundingClientRect().height) + chrome;
        if (Math.abs(height - window.outerHeight) > 2) {
            await browser.windows.update(win.id, { height: height });
        }
    } catch (e) {
        console.error("WarnAttachment: resizing the dialog failed", e);
    }
}

async function startup() {
    const data = await browser.runtime.sendMessage({ type: "warnattachment-dialog-init", id: dialogId });
    if (!data) {
        // unknown dialog (e.g. background script restarted): nothing to decide
        window.close();
        return;
    }

    const main = document.getElementById("dialog");
    const cancel = document.getElementById("cancel");
    const open = document.getElementById("open");

    main.className = data.kind;               // "warn" or "block"
    document.title = data.title;
    document.getElementById("title").textContent = data.title;
    document.getElementById("filename").textContent = data.filename || "";

    // sender and subject, rows without a value are hidden
    for (const key of ["author", "subject"]) {
        const value = data[key] || "";
        const label = document.getElementById(key + "-label");
        const field = document.getElementById(key);
        label.textContent = msg(key == "author" ? "dialog.from" : "dialog.subject");
        field.textContent = value;
        label.hidden = field.hidden = (value == "");
    }
    document.getElementById("source").hidden = !(data.author || data.subject);
    document.getElementById("text").textContent = data.text;

    if (data.kind == "warn") {
        cancel.textContent = msg("dialog.cancel");
        startCountdown(open, msg("dialog.open"), data.timeout);
        open.addEventListener("click", () => answer(true));
    } else {
        cancel.textContent = msg("dialog.ok");
        open.hidden = true;
    }
    cancel.addEventListener("click", () => answer(false));

    main.hidden = false;
    cancel.focus();       // the safe choice is the default
    updateActionsLayout();
    await fitWindow();
}

// Esc cancels
document.addEventListener("keydown", e => {
    if (e.key == "Escape") {
        e.preventDefault();
        answer(false);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    startup().catch(e => {
        console.error("WarnAttachment: dialog failed", e);
        window.close();
    });
});
