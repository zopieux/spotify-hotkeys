LOCALES = $(addprefix src/_locales/,$(addsuffix /messages.json,en fr))
SRCS = src/manifest.json src/background.js $(LOCALES)
LOGO = logo.svg
ICONS = $(addprefix src/icon-,$(addsuffix .png,16 32 48 128))
SIGNKEY = sign-key.pem

all: spotify-hotkeys.zip

src/icon-%.png: logo.svg
	inkscape -w $* -h $* -o $@ $<

spotify-hotkeys.zip: $(SRCS) $(ICONS)
	rm -f $@
	zip -r $@ src/

store%.png: store%.xcf
	gimp -i -b '(let* ((image (car (gimp-file-load RUN-NONINTERACTIVE "$<" "$<"))) (drawable (car (gimp-image-merge-visible-layers image CLIP-TO-IMAGE)))) (file-png-save-defaults RUN-NONINTERACTIVE image drawable "$@" "$@"))' -b '(gimp-quit 0)'
