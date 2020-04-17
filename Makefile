SRCS = src/manifest.json src/background.js
SIGNKEY = spotify-hotkeys.pem

CHROME = chromium

all: spotify-hotkeys.crx

spotify-hotkeys.crx: $(SRCS)
	$(CHROME) \
	  --pack-extension=src/ \
	  --pack-extension-key=s$(SIGNKEY)
