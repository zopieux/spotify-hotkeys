SRCS = src/manifest.json src/background.js
LOGO = logo.svg
ICONS = $(addprefix src/icon-,$(addsuffix .png,16 32 48 128))
SIGNKEY = sign-key.pem

all: spotify-hotkeys.zip

src/icon-%.png: logo.svg
	inkscape -w $* -h $* -o $@ $<

spotify-hotkeys.zip: $(SRCS) $(ICONS)
	zip -r $@ src/
