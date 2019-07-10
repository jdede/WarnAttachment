all:warnattachment.jar

warnattachment.jar: content/*.js content/*.xul locale/en-US/*.dtd locale/en-US/*.properties locale/de-DE/*.dtd locale/de-DE/*.properties locale/fr-FR/*.dtd locale/fr-FR/*.properties
	rm -f warnattachment.jar
	zip $@ $^


