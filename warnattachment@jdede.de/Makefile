all:warnattachment.xpi

FILES = .

warnattachment.xpi: $(FILES)
	rm -f ../$@
	zip -r ../$@ $^ -x Makefile *.swp

