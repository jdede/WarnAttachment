all:warnattachment.xpi

EXT_DIR = warnattachment@jdede.de

.PHONY: warnattachment.xpi

warnattachment.xpi:
	$(MAKE) -C $(EXT_DIR)

