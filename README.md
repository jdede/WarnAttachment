WarnAttachment
==============

This Thunderbird extension warnst against potential malicious attachments like
docm and xlsm files. A set of highly risky attachments are blocked (cmd, exe
etc.). See corresponding section in this document for an overview of file
extensions.

There is a lot of space for improvements. Feel free to contribute and send pull
requests.

Special thanks to Sarah ( [www.astriia.de](http://www.astriia.de/) ) for
creating the logo!

This extension can be downloaded directly from the Thunderbird add-on repository: https://addons.thunderbird.net/de/thunderbird/addon/warnattachment/

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

`chrome.manifest`
-----------------

The `chrome.manifest` contains the references to the localization files as well
as to the content of the application. These references differ depending on the
build type:

* For building the `*.xpi` file, the references need to point to the compressed
  archives. This is the default setting in the `chrome.manifest`. These
  settings are also stored in the file `chrome.manifest.compressed` which can
  be used to recover the original settings.

* For developing (without creating the `*.xpi` file for each step), the
  extension can be used in an uncompressed way (see previous step). For this,
  the references in the `chrom.manifest` need to be adapted as done in the file
  `chrome.manifest.uncompressed`. Copy this file over the original
  `chrome.manifest` and add the link as mentioned before to the profile /
  extension directory. **Do not forget to change back to the
  `chrome.manifest.compressed` before creating the `*.xpi` file!**

Building
--------

To build the `.xpi` extension file, simply run `make` in the root directory of
this repository.

Binaries
========

For convenience, the binaries are provided in the [bin](bin) directory.

Compatibility tests
===================

WarnAttachment is tested using several versions of Thunderbird on a Linux (Debian-based) system. Currently (March 2019), the following Thunderbird versions are tested (subject to change):

* Thunderbird 38 (German)
* Thunderbird 52 (German)
* Thunderbird 60 (German, US-English)


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

Credits
=======

* Thanks to Sarah ( [www.astriia.de](http://www.astriia.de/) ) for creating the logo.
* Thanks to Nicolas (@nilaudat) for contributing the French translation.

License
=======

Jens Dede <warnattachment@jdede.de>, 2019

This code is licensed under the GPLv3


