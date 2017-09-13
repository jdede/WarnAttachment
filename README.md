WarnAttachment
==============

This Thunderbird extension warnst against potential malicious attachments like
docm and xlsm files. A set of highly risky attachments are blocked (cmd, exe
etc.). See corresponding section in this document for an overview of file
extensions.

There is a lot of space for improvements. Feel free to contribute and send pull
requests.

Special thanks to Sarah (https://www.facebook.com/astriiaillustration/) for
creating the logo!

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

**The user can not open attachments with these extensions.**

Development
===========

Testing
-------

To test the extension without installing the xpi file, you can either copy the
complete directory into you `extensions` directory, i.e., the
`warnattachment@jdede.de`. Alternatively, you can create a text file named
`warnattachment@jdede.de` into your extension directory. In that file, you
should provide the absolute path to the git repository like for example
`/home/user/src/github/warnAttachment/warnattachment@jdede.de/`.

Further information can be found [on the mozilla developer webpage](https://developer.mozilla.org/en-US/Add-ons/Thunderbird/Building_a_Thunderbird_extension_7:_Installation)

Building
--------

To build the `.xpi` extension file, simply run `make` in the root directory of
this repository.

Binaries
========

For convenience, the binaries are provided in the [bin](bin) directory.

Changelog
=========

For changes, check the [CHANGELOG.md](CHANGELOG.md) file in the current directory

TODO
====

* The configuration dialog should be extended
* Nicer icon / logo
* Migrate to WebExtensions

License
=======

Jens Dede <mail@jdede.de>, 2017

This code is licensed under the GPLv3


