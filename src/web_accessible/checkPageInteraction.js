/**
 * Checks user interacted with page before dispatching `command`.
 * - Presents modal dialog if attempting to dispatch `'play-pause'`/`'next'`/`'previous'`.
 * - Mitigates effect of `DOMException: play() failed because the user didn't interact with the document first`.
 * @param { string } command
 * @param { (command: string) => * } successCallback
 */
function checkPageInteraction(command, successCallback) {
  let dialog = document.querySelector('#swph__dialog');

  if (
    // Check user interacted with page before executing commands.
    !window.navigator.userActivation.hasBeenActive &&
    // Skip check if audio routed to other device (or tab).
    !document.querySelector('#device-picker-icon-button.control-button--active')
  ) {
    if (!dialog) {
      const dialogStyle = document.createElement('style');
      dialogStyle.id = 'swph__dialog-style';
      dialogStyle.innerText = `
        #swph__dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(5px);
        }
        #swph__dialog {
          max-width: 50vh;
          padding: 0.75em;
          border-radius: 8px;
          user-select: none;
          text-align: center;
        }
        #swph__dialog img {
          height: 1.5em;
        }
        #swph__dialog p {
          line-height: 1.25em;
          padding: 0.25em;
        }
        #swph__dialog-title {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        #swph__dialog-text {
          font-size: 0.95em;
        }
        #swph__dialog-subtext {
          opacity: 0.65;
          font-size: 0.8em;
        }
			`.replace(/^\s+/gm, '');
      dialog = document.createElement('dialog');
      dialog.id = 'swph__dialog';
      dialog.innerHTML = `
        <p id="swph__dialog-title"><img src="${chrome.runtime.getURL('web_accessible/logo.svg')}">&nbsp;<span>${chrome.i18n.getMessage('application_title')}</span></p>
        <p id="swph__dialog-text">${chrome.i18n.getMessage('interact_dialog_text')}</p>
        <p id="swph__dialog-subtext">${chrome.i18n.getMessage('interact_dialog_subtext')}</p>
      `.replace(/^\s+/gm, '');
      [dialogStyle, dialog].forEach((e) => document.body.insertAdjacentElement('beforeend', e));
      // Stop 'Esc' key from closing modal by default - doesn't count as user interaction.
      // https://www.zdnet.com/article/google-changes-how-the-escape-key-is-handled-in-chrome-to-fight-popup-ads/
      dialog.addEventListener('cancel', (ev) => ev.preventDefault());

      function reactToUserInteraction(ev) {
        if (!window.navigator.userActivation.hasBeenActive) return;
				if (dialog.dataset.swphLastCommand) successCallback(dialog.dataset.swphLastCommand);
        document.querySelectorAll('[id*="swph__"').forEach((e) => e.remove());
        ['keydown', 'pointerdown'].forEach((evType) => window.removeEventListener(evType, reactToUserInteraction));
      }
      ['keydown', 'pointerdown'].forEach((evType) => window.addEventListener(evType, reactToUserInteraction, { passive: true }));
    }
    dialog.close();

    if (['play-pause', 'next', 'previous'].includes(command)) {
      dialog.dataset.swphLastCommand = command;
      // Only block commands that actually affect playback - 'previous' & 'next'
      // don't always start playback but can sometimes throw user out of current
      // queue if paused & skipping to an advert.
      dialog.showModal();
      // Send response to tell service worker to focus Spotify tab.
      return 'requestUserInteraction';
    } else {
      delete dialog.dataset.swphLastCommand;
    }
  } else {
    dialog?.close();
  }
}

export default checkPageInteraction;
