all: check warnattachment.xpi

EXT_DIR = warnattachment@jdede.de

.PHONY: warnattachment.xpi check

check:
	python3 tools/check.py

warnattachment.xpi: check
	$(MAKE) -C $(EXT_DIR)
