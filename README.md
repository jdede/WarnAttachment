WarnAttachment
==============

This Thunderbird extension warnst against potential malicious attachments like
docm and xlsm files. A set of highly risky attachments are blocked (cmd, exe
etc.). See corresponding section in this document for an overview of file
extensions.

WarnAttachment only warns when opening attachments; saving is intentionally not
blocked to reduce the workload for admins. Furthermore, the local
countermeasures should catch threats in case of locally saved files.

There is a lot of space for improvements. Feel free to contribute and send pull
requests.

Special thanks to Sarah (astriia) for creating the logo!

This extension can be downloaded directly from the Thunderbird add-on repository: https://addons.thunderbird.net/de/thunderbird/addon/warnattachment/

Version numbering
-----------------

The Thunderbird API is constantly changing and this extension has to be adapted
accordingly. Currently, two branches exist:

* Major version number starting with 0, i.e. 0.12 is for Thunderbird 60.x and
  below.
* Major version number starting with 1, i.e. 1.1 is for Thunderbird 68.x and
  above.
* Starting with version 2.14, at least Thunderbird 126.0

I try my best to test all possible combinations. If you find any problems, feel
free to open an issue or drop me a line.

Warning Message Extensions
--------------------------

A warning message is shown for the following file extensions:

* DOC
* DOCM
* PPT
* PPTM
* XLS
* XLSM
* PPS
* PPSM
* ZIP
* RAR
* 7z
* HTM
* HTML
* DOTM
* XLTM
* XLAM
* POTM
* PPAM
* SLDM
* RTF
* SVG
* SHTML
* XHTML
* GZ
* TGZ
* TAR
* XZ
* ZST
* ACE
* ARJ
* ONE
* SH
* URL

These files may contain macro viruses which are nowadays commonly used for
encryption malware. The user is asked if s/he is really willing to open the
file and if it is from a trustworthy source. The button "Open anyway" is enabled after
a countdown (default: 3 seconds, can be changed in the settings).

Block Message Extensions
------------------------

The following extensions are blocked completely. The user is not able to open
these files (besides deactivating the plugin). The source of these file types
is [this google mail support page](https://support.google.com/mail/answer/6590):

* ADE
* ADP
* BAT
* CHM
* CMD
* COM
* CPL
* EXE
* HTA
* INS
* ISP
* JAR
* JS
* JSE
* LIB
* LNK
* MDE
* MSC
* MSI
* MSP
* MST
* NSH
* PIF
* SCR
* SCT
* SHB
* SYS
* VB
* VBE
* VBS
* VXD
* WSC
* WSF
* WSH
* INETLOC
* IMG
* ISO
* DIAGCAB
* PS1
* PSM1
* PS1XML
* VHD
* VHDX
* MSIX
* APPX
* APPXBUNDLE
* APPINSTALLER
* XLL
* REG
* CAB
* SETTINGCONTENT-MS
* LIBRARY-MS
* SEARCH-MS
* IQY
* SLK
* ACCDE
* DESKTOP
* COMMAND
* APP
* DMG
* PKG

**The user can not open attachments with these extensions.**

Central configuration (enterprise policies)
-------------------------------------------

Administrators can set and lock the settings for all users with the
Thunderbird enterprise policy `3rdparty` (`policies.json`, Windows group
policies or similar). Settings set by a policy can not be changed by the user;
they are shown read-only in the settings dialog.

Example `policies.json`:

```json
{
  "policies": {
    "3rdparty": {
      "Extensions": {
        "warnattachment@jdede.de": {
          "blocked": "EXE,BAT,CMD,COM,JS,VBS,PS1,MSI,LNK,ISO,IMG",
          "warn": "DOC,DOCM,XLS,XLSM,ZIP,RAR,7Z,HTML,HTM",
          "user_warning_msg": "Only open attachments from known senders.",
          "user_blocked_msg": "This attachment is blocked. Please contact the IT department.",
          "timeout": 5,
          "locked": true
        }
      }
    }
  }
}
```

| Key                | Type    | Description                                             |
|--------------------|---------|---------------------------------------------------------|
| `blocked`          | string  | Comma separated list of blocked file extensions         |
| `warn`             | string  | Comma separated list of file extensions with a warning  |
| `user_warning_msg` | string  | Text of the warning dialog                              |
| `user_blocked_msg` | string  | Text of the blocking dialog                             |
| `timeout`          | number  | Seconds before "Open anyway" can be clicked (0–60, `0` disables the countdown) |
| `locked`           | boolean | `true`: settings not given in the policy are locked to the default values, so the user can not change anything |

All keys are optional. Without `locked`, settings not given in the policy can
still be changed by the user.

Development
===========

Testing
-------

Thunderbird offers a nice tutorial on MailExtensions:
[developer.thunderbird.net](WarnAttachment)

This Thunderbird extension warnst against potential malicious attachments like
docm and xlsm files. A set of highly risky attachments are blocked (cmd, exe
etc.). See corresponding section in this document for an overview of file
extensions.

There is a lot of space for improvements. Feel free to contribute and send pull
requests.

Special thanks to Sarah (astriia) for creating the logo!

This extension can be downloaded directly from the Thunderbird add-on repository: https://addons.thunderbird.net/de/thunderbird/addon/warnattachment/

Version numbering
-----------------

The Thunderbird API is constantly changing and this extension has to be adapted
accordingly. Currently, several branches exist:

* Major version number starting with 0, i.e. 0.12 is for Thunderbird 60.x and
  below.
* Major version number starting with 1, i.e. 1.1 is for Thunderbird 68.x and
  above.
* Major version number starting with 2: is for Thunderbird 71.x and above and
  based on WebExtension / MailExtension. This one is the master

I try my best to test all possible combinations. If you find any problems, feel
free to open an issue or drop me a line.

Development
===========

Testing
-------

Thunderbird offers a nice tutorial on MailExtensions:
[developer.thunderbird.net](https://developer.thunderbird.net/add-ons/about-add-ons)




Building
--------

To build the `.xpi` extension file, simply run `make` in the root directory of
this repository.

Binaries
========

For convenience, the binaries are provided in the [bin](bin) directory.

Compatibility tests
===================

WarnAttachment is tested using several versions of Thunderbird on a Linux (Debian-based) system. Currently (November 2019), the following Thunderbird versions are tested (subject to change):

Thunderbird till version 60.x
-----------------------------

* Thunderbird 38 (German)
* Thunderbird 52 (German)
* Thunderbird 60 (German, US-English, French)

Starting with version 68.x
--------------------------

* Thunderbird 68 (German, US-English, French, Italian)
* Thunderbird 78 (German, US-English, Spanish, Polish)
* Thunderbird 89b (US-English)
* Thunderbird 91 (German)
* Thunderbird 102 (German)
* Thunderbird 115 (beta, US-English)
* Thunderbird 126 (beta, US-English)
* Thunderbird 128 (German)
* Thunderbird 140 (German)
* Thunderbird 141 (beta, US-English)
* Thunderbird 140 (Bulgarian)
* Thunderbird 148 (German)
* Thunderbird 152 (German)
* Thunderbird 153 (German)
* Thunderbird 155B (German)
* Thunderbird 160B (German)

Changelog
=========

For changes, check the [CHANGELOG.md](CHANGELOG.md) file in the current directory

Known Issues
============

* Attachment decoded from an TNEF (Outlook / winmail.dat) attachment can not be
  checked.

TODO
====

* The configuration dialog should be extended
* Prevent saving files and not just opening
* Migrate to native message API

Credits
=======

* Thanks to Sarah (astriia) for creating the logo.
* Thanks to Nicolas (@nilaudat) for contributing the French translation.
* Thanks to Massimiliano (@m-ferrero) for contributing the Italian translation.
* Thanks to Mariusz  (MX\_EH) for contributing the Polish translation.
* Thanks to Nacho for contributing the Spanish translation
* Thanks to arai-a for the global services fix
* Thanks to patrikv14 for the Slovak translation
* Thanks to metodi100 for the Bulgarian translation

License
=======

Jens Dede <warnattachment@jdede.de>, 2026

This code is licensed under the GPLv3


