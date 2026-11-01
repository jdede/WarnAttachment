#!/usr/bin/env python3
"""Consistency checks for WarnAttachment. Run from the repository root.

Errors make the script fail (exit code 1). Warnings (e.g. missing
translations) are only reported, unless --strict is given.
"""

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

EXT_DIR = Path("warnattachment@jdede.de")
LOCALES_DIR = EXT_DIR / "_locales"
MESSAGES = LOCALES_DIR / "en" / "messages.json"
README = Path("README.md")
CHANGELOG = Path("CHANGELOG.md")
BACKGROUND = EXT_DIR / "background.js"
MANIFEST = EXT_DIR / "manifest.json"

# Messages that are the same for all languages and are only defined in the
# default locale (the extension lists are the single point of truth there)
LANGUAGE_INDEPENDENT = {"warningMessageTypes", "blockingMessageTypes", "app.title"}

PLACEHOLDER_RE = re.compile(r"\$[A-Za-z0-9_@]+\$|\$\d")

ENTRY_RE = re.compile(r"^[A-Z0-9-]+$")
STRICT = "--strict" in sys.argv[1:]
errors = []
warnings = []


def error(msg):
    errors.append(msg)
    print("ERROR:", msg)


def warning(msg):
    warnings.append(msg)
    print("WARNING:", msg)


def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        error(f"{path}: invalid JSON ({e})")
        return None


def split_list(s):
    return [e.strip() for e in s.split(",")]


def check_list(name, entries):
    for e in entries:
        if not ENTRY_RE.match(e):
            error(f"{name}: invalid entry {e!r} (missing comma?)")
    dups = sorted({e for e in entries if entries.count(e) > 1})
    if dups:
        error(f"{name}: duplicates {dups}")


def readme_list(text, heading, end_marker):
    try:
        section = text.split(heading, 1)[1].split(end_marker, 1)[0]
    except IndexError:
        error(f"README: section {heading!r} not found")
        return []
    return [l[2:].strip().upper() for l in section.splitlines() if l.startswith("* ")]


# 1) All JSON files must be valid
for path in sorted(EXT_DIR.rglob("*.json")):
    load_json(path)

# 2) Extension lists: format, duplicates, overlap
messages = load_json(MESSAGES) or {}
warn = split_list(messages.get("warningMessageTypes", {}).get("message", ""))
blocked = split_list(messages.get("blockingMessageTypes", {}).get("message", ""))
check_list("warningMessageTypes", warn)
check_list("blockingMessageTypes", blocked)
both = sorted(set(warn) & set(blocked))
if both:
    error(f"extensions in warn AND block list: {both}")

# 3) README must document the same lists
readme = README.read_text(encoding="utf-8")
for name, entries, heading, end in [
    ("warn", warn, "Warning Message Extensions", "These files"),
    ("block", blocked, "Block Message Extensions", "**The user"),
]:
    documented = readme_list(readme, heading, end)
    if missing := sorted(set(entries) - set(documented)):
        error(f"README ({name}): not documented {missing}")
    if extra := sorted(set(documented) - set(entries)):
        error(f"README ({name}): documented but not in list {extra}")

# 4) Extensions added by a migration step must be part of the defaults
bg = BACKGROUND.read_text(encoding="utf-8")
for m in re.finditer(r"const (warnAttachmentAddedIn\w+)\s*=\s*\{(.*?)\}", bg, re.S):
    for key, value in re.findall(r"(warn|blocked)\s*:\s*\"([^\"]*)\"", m.group(2)):
        added = split_list(value)
        check_list(f"{m.group(1)}.{key}", added)
        target = warn if key == "warn" else blocked
        if missing := sorted(set(added) - set(target)):
            error(f"{m.group(1)}.{key}: not in default list {missing}")

# 5) Current version must have a CHANGELOG entry
manifest = load_json(MANIFEST) or {}
version = manifest.get("version", "")
if f"Version {version}" not in CHANGELOG.read_text(encoding="utf-8"):
    error(f"CHANGELOG: no entry for version {version}")

# 6) Translations: every locale must contain all messages of the default
#    locale (except the language independent ones)
default_locale = manifest.get("default_locale", "en")
reference_file = LOCALES_DIR / default_locale / "messages.json"
reference = load_json(reference_file) if reference_file.exists() else None
if reference is None:
    error(f"default locale {default_locale!r}: {reference_file} missing")
    reference = {}


def check_entries(locale, data):
    """Every entry needs a non-empty "message" string."""
    for key, entry in data.items():
        if not isinstance(entry, dict) or not isinstance(entry.get("message"), str):
            error(f"locale {locale}: {key!r} has no \"message\" string")
        elif not entry["message"].strip():
            warning(f"locale {locale}: {key!r} is empty")


check_entries(default_locale, reference)
expected = set(reference) - LANGUAGE_INDEPENDENT

for locale_dir in sorted(p for p in LOCALES_DIR.iterdir() if p.is_dir()):
    locale = locale_dir.name
    if locale == default_locale:
        continue
    path = locale_dir / "messages.json"
    if not path.exists():
        error(f"locale {locale}: {path} missing")
        continue
    data = load_json(path)
    if not isinstance(data, dict):
        continue

    check_entries(locale, data)

    if missing := sorted(expected - set(data)):
        warning(f"locale {locale}: {len(missing)} translation(s) missing: {', '.join(missing)}")
    if unknown := sorted(set(data) - set(reference)):
        warning(f"locale {locale}: unknown / obsolete key(s): {', '.join(unknown)}")
    if overrides := sorted((set(data) & LANGUAGE_INDEPENDENT) - {"app.title"}):
        error(f"locale {locale}: must not define {', '.join(overrides)} "
              f"(only allowed in {default_locale})")

    # placeholders like $1 or $NAME$ must be kept in the translation
    for key in sorted(expected & set(data)):
        ref_msg = reference[key].get("message", "") if isinstance(reference[key], dict) else ""
        msg = data[key].get("message", "") if isinstance(data[key], dict) else ""
        if sorted(PLACEHOLDER_RE.findall(ref_msg)) != sorted(PLACEHOLDER_RE.findall(msg)):
            warning(f"locale {locale}: {key!r} placeholders differ from {default_locale}")

# 7) JavaScript syntax (only if node is installed)
if shutil.which("node"):
    for path in sorted(EXT_DIR.rglob("*.js")):
        r = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
        if r.returncode != 0:
            error(f"{path}: syntax error\n{r.stderr.strip()}")
else:
    print("note: node not found, skipping JavaScript syntax check")

if warnings or errors:
    print()
if warnings:
    print(f"{len(warnings)} warning(s)")
if errors:
    print(f"{len(errors)} error(s) found")
    sys.exit(1)
if warnings and STRICT:
    print("Failed because of warnings (--strict)")
    sys.exit(1)
print("All checks passed" + (" (with warnings)" if warnings else ""))
