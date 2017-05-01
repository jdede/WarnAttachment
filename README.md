WarnAttachment
==============

This Thunderbird extension warnst against potential malicious attachments like
docx and xlsx files. A set of highly risky attachments are blocked (cmd, exe
etc.)

There is a lot of space for improvement. Feel free to contribute and send pull
requests.

Warning
-------

A warning message is shown for the following extensions:

* DOC
* DOCX
* PPT
* PPTX
* XLS
* XLSX

These files may contain macro viruses which are nowadays commonly used for
encryption malware. The user is asked if s/he is really willing to open the
file and if it is from a trustworthy source.

Block
-----

The following extensions are blocked completely. The source of these file types
is from google mail: https://support.google.com/mail/answer/6590

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

The user can not open that file extension.

TODO
====

* The file extensions should be configurable not only via about:config
* Nicer icon / logo

License
=======

Jens Dede <mail@jdede.de>, 2017

This code is licensed under the GPLv3


