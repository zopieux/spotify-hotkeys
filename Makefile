SRCS = src/manifest.json src/background.js
SIGNKEY = sign-key.pem

CHROME = chromium

all: spotify-hotkeys.crx

spotify-hotkeys.crx: $(SRCS)
	$(CHROME) \
	  --pack-extension=src/ \
	  --pack-extension-key=$(SIGNKEY)
