WarnAttachment
==============

This Thunderbird extension warnst against potential malicious attachments like
docm and xlsm files. A set of highly risky attachments are blocked (cmd, exe
etc.). See corresponding section in this document for an overview of file
extensions.

There is a lot of space for improvements. Feel free to contribute and send pull
requests.

Special thanks to Sarah (astriia) for
creating the logo!

This extension can be downloaded directly from the Thunderbird add-on repository: https://addons.thunderbird.net/de/thunderbird/addon/warnattachment/

Version numbering
-----------------

The Thunderbird API is constantly changing and this extension has to be adapted
accordingly. Currently, two branches exist:

* Major version number starting with 0, i.e. 0.12 is for Thunderbird 60.x and
  below.
* Major version number starting with 1, i.e. 1.1 is for Thunderbird 68.x and
  above.

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

These files may contain macro viruses which are nowadays commonly used for
encryption malware. The user is asked if s/he is really willing to open the
file and if it is from a trustworthy source.

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

**The user can not open attachments with these extensions.**

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

License
=======

Jens Dede <warnattachment@jdede.de>, 2023

This code is licensed under the GPLv3


