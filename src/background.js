async function sendCommandToTab(command, tab) {
  // Let's have multiple methods to find the right button, because Spotify
  // decided front-end development was more exciting with randomized CSS
  // classes... but not for all UI elements of course. Yay, consistency!
  async function findAndClick(command, tabIsActive) {
    // https://github.com/mantou132/Spotify-Lyrics/issues/94
    const DENY = '.extension-lyrics-button';

    function animate(e) {
      try {
        const anim = (i) => {
          e.style.transform = (i % 2 == 1) ? 'scale(0.8)' : null;
          if (i == 0) return;
          setTimeout(() => anim(i - 1), 80);
        };
        anim(2);
      } catch (_) { }
    }

    function clickAndAnimate(e) {
      if (!e) throw 'element not found';
      e.click();
      if (e.tagName.toLowerCase() === 'button') animate(e);
    }

    function usingSlider(selector, goUp, step) {
      const slider = document.querySelector(selector);
      const increment = (goUp ? +1 : -1) * step;
      const max = parseFloat(slider.max);
      const min = parseFloat(slider.min);
      const wanted = parseFloat(slider.value) + increment * (max - min);
      const value = Math.max(min, Math.min(max, wanted)).toFixed(2);
      slider.value = value;
      slider.dispatchEvent(new Event('change', { value, bubbles: true }));
    }

    function usingVolumeSlider(command) {
      usingSlider('[data-testid*=volume] input[type=range]', command == 'volume-up', 0.1);
    }

    function usingSeekSlider(command) {
      usingSlider('[data-testid=playback-progressbar] input[type=range]', command == 'seek-forward', 0.05);
    }

    // A Very Cursed search for a specific iconography using SVG path d= attr.
    function getFooterButtonBySvgPath(paths) {
      const selector = paths.map(p => `footer button:has(svg path[d="${p}"])`).join(', ');
      return document.querySelector(selector);
    }

    function getFooterLikedButton() {
      const paths = ['M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm11.748-1.97a.75.75 0 0 0-1.06-1.06l-4.47 4.47-1.405-1.406a.75.75 0 1 0-1.061 1.06l2.466 2.467 5.53-5.53z'];
      return getFooterButtonBySvgPath(paths)
    }

    function clickUnlike() {
      if (!tabIsActive) {
        console.warn('[Spotify Web Player Hotkeys] Unliking song requires the tab to be active');
        return;
      }
      let observerTarget = document.body;
      let contextMenu = document.querySelector('#context-menu:has([aria-labelledby="listrow-title-spotify:collection:tracks"])');
      let unlikeBtn = getFooterLikedButton();
      const removeObserver = () => {
        unlikeObserver.disconnect();
        unlikeObserver = null;
      }
      let unlikeObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (observerTarget !== document.body && [...mutation.removedNodes].some(n => n.id === 'context-menu' || n.querySelector('#context-menu'))) {
            removeObserver();
            return;
          }
          [...mutation.addedNodes].some(n => {
            if (!contextMenu) {
              if (!!(contextMenu = n.querySelector('#context-menu'))) {
                observerTarget = n;
                unlikeObserver.disconnect();
                unlikeObserver.observe(observerTarget, { childList: true, subtree: true });
                unlikeBtn = null;
                return true;
              }
            } else if (contextMenu && !unlikeBtn) {
              if (!!(unlikeBtn = n.querySelector('button:has([aria-labelledby="listrow-title-spotify:collection:tracks"])'))) {
                if (unlikeBtn.ariaChecked === 'true') unlikeBtn.click();
                return true;
              }
            } else if (n && n?.tagName.toLowerCase() === 'button' && n?.getAttribute('type') === 'submit') {
              n.click();
              removeObserver();
              return true;
            }
          });
        }
      });
      unlikeObserver.observe(observerTarget, { childList: true, subtree: true });
      unlikeBtn.click();
    }

    function usingSelector(command) {
      const spoticon = x => `.control-button.spoticon-${x}-16`;
      const testid = x => `[data-testid=${x}]`;
      const selectors = {
        'play-pause': [spoticon('play'), spoticon('pause'), testid('control-button-play'), testid('control-button-pause'), testid('control-button-playpause')],
        'next': [spoticon('skip-forward'), testid('control-button-skip-forward')],
        'previous': [spoticon('skip-back'), testid('control-button-skip-back')],
        'shuffle': [spoticon('shuffle'), testid('control-button-shuffle')],
        'repeat': [spoticon('repeat'), spoticon('repeatonce'), testid('control-button-repeat')],
        'volume-mute': ['.volume-bar__icon-button control-button', testid('volume-bar-toggle-mute-button')],
        'queue': [testid('control-button-queue')],
        'now-playing': [testid('control-button-npv')],
        'go-home': ['nav a[href="/"]'],
        'go-search': ['nav a[href="/search"]'],
      }[command];
      if (!selectors) throw '';
      const selector = selectors.map(s => `${s}:not(${DENY})`).join(', ');
      const node = document.querySelector(selector);
      if (!node) throw '';
      clickAndAnimate(node);
    }

    function usingSvg(command) {
      const paths = {
        'play-pause': [
          'M0 0h16v16H0z',
          'M4.018 14L14.41 8 4.018 2z',
          'M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z',
          'M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z',
          'M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z',
          'M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z',
        ],
        'next': [
          'M11 3v4.119L3 2.5v11l8-4.619V13h2V3z',
          'M12.7 1a.7.7 0 00-.7.7v5.15L2.05 1.107A.7.7 0 001 1.712v12.575a.7.7 0 001.05.607L12 9.149V14.3a.7.7 0 00.7.7h1.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-1.6z',
          'M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z',
        ],
        'previous': [
          'M13 2.5L5 7.119V3H3v10h2V8.881l8 4.619z',
          'M3.3 1a.7.7 0 01.7.7v5.15l9.95-5.744a.7.7 0 011.05.606v12.575a.7.7 0 01-1.05.607L4 9.149V14.3a.7.7 0 01-.7.7H1.7a.7.7 0 01-.7-.7V1.7a.7.7 0 01.7-.7h1.6z',
          'M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z',
        ],
        'shuffle': [
          'M4.5 6.8l.7-.8C4.1 4.7 2.5 4 .9 4v1c1.3 0 2.6.6 3.5 1.6l.1.2zm7.5 4.7c-1.2 0-2.3-.5-3.2-1.3l-.6.8c1 1 2.4 1.5 3.8 1.5V14l3.5-2-3.5-2v1.5zm0-6V7l3.5-2L12 3v1.5c-1.6 0-3.2.7-4.2 2l-3.4 3.9c-.9 1-2.2 1.6-3.5 1.6v1c1.6 0 3.2-.7 4.2-2l3.4-3.9c.9-1 2.2-1.6 3.5-1.6z',
          'M7.5 10.723l.98-1.167.957 1.14a2.25 2.25 0 001.724.804h1.947l-1.017-1.018a.75.75 0 111.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 11-1.06-1.06L13.109 13H11.16a3.75 3.75 0 01-2.873-1.34l-.787-.938z',
          'M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z',
          'm7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34l-.787-.938z',
        ],
        'like': [
          'M11.75 8a.75.75 0 0 1-.75.75H8.75V11a.75.75 0 0 1-1.5 0V8.75H5a.75.75 0 0 1 0-1.5h2.25V5a.75.75 0 0 1 1.5 0v2.25H11a.75.75 0 0 1 .75.75z',
          'M13.764 2.727a4.057 4.057 0 00-5.488-.253.558.558 0 01-.31.112.531.531 0 01-.311-.112 4.054 4.054 0 00-5.487.253A4.05 4.05 0 00.974 5.61c0 1.089.424 2.113 1.168 2.855l4.462 5.223a1.791 1.791 0 002.726 0l4.435-5.195A4.052 4.052 0 0014.96 5.61a4.057 4.057 0 00-1.196-2.883zm-.722 5.098L8.58 13.048c-.307.36-.921.36-1.228 0L2.864 7.797a3.072 3.072 0 01-.905-2.187c0-.826.321-1.603.905-2.187a3.091 3.091 0 012.191-.913 3.05 3.05 0 011.957.709c.041.036.408.351.954.351.531 0 .906-.31.94-.34a3.075 3.075 0 014.161.192 3.1 3.1 0 01-.025 4.403z',
          'M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0111.88.817h.002a4.618 4.618 0 013.782 3.65v.003a4.543 4.543 0 01-1.011 3.84L9.35 14.629a1.765 1.765 0 01-2.093.464 1.762 1.762 0 01-.605-.463L1.348 8.309A4.582 4.582 0 011.689 2zm3.158.252A3.082 3.082 0 002.49 7.337l.005.005L7.8 13.664a.264.264 0 00.311.069.262.262 0 00.09-.069l5.312-6.33a3.043 3.043 0 00.68-2.573 3.118 3.118 0 00-2.551-2.463 3.079 3.079 0 00-2.612.816l-.007.007a1.501 1.501 0 01-2.045 0l-.009-.008a3.082 3.082 0 00-2.121-.861z',
          'M15.724 4.22A4.313 4.313 0 0012.192.814a4.269 4.269 0 00-3.622 1.13.837.837 0 01-1.14 0 4.272 4.272 0 00-6.21 5.855l5.916 7.05a1.128 1.128 0 001.727 0l5.916-7.05a4.228 4.228 0 00.945-3.577z',
          'M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z',
          'M11.75 8a.75.75 0 01-.75.75H8.75V11a.75.75 0 01-1.5 0V8.75H5a.75.75 0 010-1.5h2.25V5a.75.75 0 011.5 0v2.25H11a.75.75 0 01.75.75z',
          'M0 8a8 8 0 1116 0A8 8 0 010 8zm11.748-1.97a.75.75 0 00-1.06-1.06l-4.47 4.47-1.405-1.406a.75.75 0 10-1.061 1.06l2.466 2.467 5.53-5.53z',
          'M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-.605-.463L1.348 8.309A4.582 4.582 0 0 1 1.689 2zm3.158.252A3.082 3.082 0 0 0 2.49 7.337l.005.005L7.8 13.664a.264.264 0 0 0 .311.069.262.262 0 0 0 .09-.069l5.312-6.33a3.043 3.043 0 0 0 .68-2.573 3.118 3.118 0 0 0-2.551-2.463 3.079 3.079 0 0 0-2.612.816l-.007.007a1.501 1.501 0 0 1-2.045 0l-.009-.008a3.082 3.082 0 0 0-2.121-.861z',
          'M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.577z',
        ],
        'repeat': [
          'M5.5 5H10v1.5l3.5-2-3.5-2V4H5.5C3 4 1 6 1 8.5c0 .6.1 1.2.4 1.8l.9-.5C2.1 9.4 2 9 2 8.5 2 6.6 3.6 5 5.5 5zm9.1 1.7l-.9.5c.2.4.3.8.3 1.3 0 1.9-1.6 3.5-3.5 3.5H6v-1.5l-3.5 2 3.5 2V13h4.5C13 13 15 11 15 8.5c0-.6-.1-1.2-.4-1.8z',
          'M5 5v-.5V4c-2.2.3-4 2.2-4 4.5 0 .6.1 1.2.4 1.8l.9-.5C2.1 9.4 2 9 2 8.5 2 6.7 3.3 5.3 5 5zM10.5 12H6v-1.5l-3.5 2 3.5 2V13h4.5c1.9 0 3.5-1.2 4.2-2.8-.5.3-1 .5-1.5.6-.7.7-1.6 1.2-2.7 1.2zM11.5 0C9 0 7 2 7 4.5S9 9 11.5 9 16 7 16 4.5 14 0 11.5 0zm.9 7h-1.3V3.6H10v-1h.1c.2 0 .3 0 .4-.1.1 0 .3-.1.4-.2.1-.1.2-.2.2-.3.1-.1.1-.2.1-.3v-.1h1.1V7z',
          'M5 5V4c-2.2.3-4 2.2-4 4.5 0 .6.1 1.2.4 1.8l.9-.5C2.1 9.4 2 9 2 8.5 2 6.7 3.3 5.3 5 5zm5.5 7H6v-1.5l-3.5 2 3.5 2V13h4.5c1.9 0 3.5-1.2 4.2-2.8-.5.3-1 .5-1.5.6-.7.7-1.6 1.2-2.7 1.2zm1-12C9 0 7 2 7 4.5S9 9 11.5 9 16 7 16 4.5 14 0 11.5 0zm.9 7h-1.3V3.6H10v-1h.1c.2 0 .3 0 .4-.1.1 0 .3-.1.4-.2.1-.1.2-.2.2-.3.1-.1.1-.2.1-.3v-.1h1.1V7z',
          'M0 4.75A3.75 3.75 0 013.75 1h8.5A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.018 1.018a.75.75 0 11-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 111.06 1.06L9.811 12h2.439a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25h-8.5A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5z',
          'M0 4.75A3.75 3.75 0 013.75 1h.75v1.5h-.75A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5zM12.25 2.5h-.75V1h.75A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.018 1.018a.75.75 0 11-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 111.06 1.06L9.811 12h2.439a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25z',
          'M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z',
          'M0 4.75A3.75 3.75 0 0 1 3.75 1h.75v1.5h-.75A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5zM12.25 2.5h-.75V1h.75A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25z',
          'M9.12 8V1H7.787c-.128.72-.76 1.293-1.787 1.313V3.36h1.57V8h1.55z',
        ],
        'seek-forward': [
          'M6 5h4v1.5l3.464-2L10 2.5V4H6C3.25 4 1 6.25 1 9s2.25 5 5 5v-1c-2.206 0-4-1.794-4-4s1.794-4 4-4zm1.935 3.739a1.306 1.306 0 01-.32.332c-.13.096-.281.172-.451.228a1.956 1.956 0 01-.562.092v.752h1.36v3.856h1.096V8.327h-.96c-.026.15-.08.287-.163.412zm6.139 2.628a1.664 1.664 0 00-.399-.592 1.747 1.747 0 00-.612-.368 2.295 2.295 0 00-.78-.128c-.191 0-.387.03-.584.092-.197.061-.357.15-.479.268l.327-1.352h2.376v-.96h-3.128l-.688 2.872c.037.016.106.041.204.076l.308.108.309.108.212.076c.096-.112.223-.206.38-.28.157-.075.337-.112.54-.112.133 0 .264.021.392.064a.97.97 0 01.336.188.907.907 0 01.233.316c.058.128.088.274.088.44a.941.941 0 01-.3.721.995.995 0 01-.328.196 1.19 1.19 0 01-.404.068c-.16 0-.306-.025-.436-.076a1.03 1.03 0 01-.569-.532 1.171 1.171 0 01-.1-.4l-1.04.248c.02.224.086.439.195.644.109.205.258.388.444.548.186.16.406.287.66.38.253.093.534.14.844.14.336 0 .636-.052.9-.156.264-.104.487-.245.672-.424.184-.179.325-.385.424-.62a1.91 1.91 0 00.148-.752c0-.3-.049-.566-.145-.801z',
          'M13.536 4.5h-1.473a.75.75 0 100 1.5H16V2.063a.75.75 0 00-1.5 0v1.27A8.25 8.25 0 103.962 15.887a.75.75 0 10.827-1.25A6.75 6.75 0 1113.535 4.5z',
        ],
        'seek-backward': [
          'M10 4.001H6V2.5l-3.464 2L6 6.5V5h4c2.206 0 4 1.794 4 4s-1.794 4-4 4v1c2.75 0 5-2.25 5-5s-2.25-4.999-5-4.999zM2.393 8.739c-.083.126-.19.236-.32.332a1.642 1.642 0 01-.452.229 1.977 1.977 0 01-.56.092v.752h1.36V14h1.096V8.327h-.96c-.027.15-.081.287-.164.412zm5.74 2.036a1.762 1.762 0 00-.612-.368 2.295 2.295 0 00-.78-.128c-.191 0-.387.031-.584.092a1.188 1.188 0 00-.479.268l.327-1.352H8.38v-.96H5.252l-.688 2.872c.037.017.105.042.204.076l.308.108.309.107.212.076c.096-.112.223-.205.38-.28.157-.075.337-.112.54-.112.133 0 .264.021.392.063.128.043.24.105.336.188a.907.907 0 01.233.316c.059.128.088.275.088.44a.927.927 0 01-.628.916 1.19 1.19 0 01-.404.068c-.16 0-.306-.025-.435-.076a1.046 1.046 0 01-.34-.212.992.992 0 01-.229-.32 1.171 1.171 0 01-.1-.4l-1.04.248c.021.225.086.439.195.645.109.205.258.388.444.548.187.16.406.287.66.38.253.093.534.14.844.14.336 0 .636-.052.9-.156.264-.104.487-.246.672-.424.184-.179.325-.385.424-.62.099-.235.148-.485.148-.752 0-.298-.049-.565-.145-.8a1.686 1.686 0 00-.399-.591z',
          'M2.464 4.5h1.473a.75.75 0 110 1.5H0V2.063a.75.75 0 011.5 0v1.27a8.25 8.25 0 1110.539 12.554.75.75 0 01-.828-1.25A6.75 6.75 0 102.464 4.5z',
        ],
        'volume-mute': [
          'M10.116 1.5A.75.75 0 008.991.85l-6.925 4a3.642 3.642 0 00-1.33 4.967 3.639 3.639 0 001.33 1.332l6.925 4a.75.75 0 001.125-.649v-1.906a4.73 4.73 0 01-1.5-.694v1.3L2.817 9.852a2.141 2.141 0 01-.781-2.92c.187-.324.456-.594.78-.782l5.8-3.35v1.3c.45-.313.956-.55 1.5-.694V1.5z',
          'M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 010 4.88z',
          'M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 0 1 0 4.88z',
          'M11.5 13.614a5.752 5.752 0 0 0 0-11.228v1.55a4.252 4.252 0 0 1 0 8.127v1.55z',
          'M10.116 1.5A.75.75 0 0 0 8.991.85l-6.925 4a3.642 3.642 0 0 0-1.33 4.967 3.639 3.639 0 0 0 1.33 1.332l6.925 4a.75.75 0 0 0 1.125-.649v-1.906a4.73 4.73 0 0 1-1.5-.694v1.3L2.817 9.852a2.141 2.141 0 0 1-.781-2.92c.187-.324.456-.594.78-.782l5.8-3.35v1.3c.45-.313.956-.55 1.5-.694V1.5z',
          'M13.86 5.47a.75.75 0 0 0-1.061 0l-1.47 1.47-1.47-1.47A.75.75 0 0 0 8.8 6.53L10.269 8l-1.47 1.47a.75.75 0 1 0 1.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 0 0 1.06-1.06L12.39 8l1.47-1.47a.75.75 0 0 0 0-1.06z',
        ],
        'toggle-now-playing': [
          'M15.002 1.75A1.75 1.75 0 0 0 13.252 0h-10.5a1.75 1.75 0 0 0-1.75 1.75v12.5c0 .966.783 1.75 1.75 1.75h10.5a1.75 1.75 0 0 0 1.75-1.75V1.75zm-1.75-.25a.25.25 0 0 1 .25.25v12.5a.25.25 0 0 1-.25.25h-10.5a.25.25 0 0 1-.25-.25V1.75a.25.25 0 0 1 .25-.25h10.5z',
          'M11.196 8 6 5v6l5.196-3z',
        ],
        'toggle-queue': [
          'M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-7A2.5 2.5 0 0 1 3.5 1h9a2.5 2.5 0 0 1 0 5h-9A2.5 2.5 0 0 1 1 3.5zm2.5-1a1 1 0 0 0 0 2h9a1 1 0 1 0 0-2h-9z',
        ],
        'toggle-lyrics': [
          'M13.426 2.574a2.831 2.831 0 0 0-4.797 1.55l3.247 3.247a2.831 2.831 0 0 0 1.55-4.797zM10.5 8.118l-2.619-2.62A63303.13 63303.13 0 0 0 4.74 9.075L2.065 12.12a1.287 1.287 0 0 0 1.816 1.816l3.06-2.688 3.56-3.129zM7.12 4.094a4.331 4.331 0 1 1 4.786 4.786l-3.974 3.493-3.06 2.689a2.787 2.787 0 0 1-3.933-3.933l2.676-3.045 3.505-3.99z',
        ],
      }[command];
      if (!paths) throw '';
      const node = getFooterButtonBySvgPath(paths);
      if (!node) throw 'button with <path> not found';
      clickAndAnimate(node);
    }

    function dispatchCommand(command) {
      if (command === 'unlike') {
        clickUnlike();
        return;
      }

      if (command == 'volume-up' || command == 'volume-down') {
        try {
          usingVolumeSlider(command);
        } catch (e) {
          console.warn(`[Spotify Web Player Hotkeys] Could not change volume slider: ${e}`);
        }
        return;
      }

      try {
        usingSelector(command);
        return;
      } catch (e) {
        try {
          usingSvg(command);
          return;
        } catch (e) {
          if (command == 'seek-forward' || command == 'seek-backward') {
            // Special case for seek: try first with selector/svg so that
            // podcasts use the correct 15s seek, then fallback on seek slider for
            // song 5s seek.
            try {
              usingSeekSlider(command);
              return;
            } catch (e) {
              console.warn(`[Spotify Web Player Hotkeys] Could not change seek slider: ${e}`);
            }
          }
          console.warn(`[Spotify Web Player Hotkeys] Could not click '${command}': ${e}`);
        }
      }
    }

    if (command === 'like' && !!getFooterLikedButton()) {
      command = 'unlike';
    }

    const result = (await import(chrome.runtime.getURL("web_accessible/checkPageInteraction.js"))).default(command, dispatchCommand);
    if (result === 'requestUserInteraction') {
      console.warn('[Spotify Web Player Hotkeys] Page interaction required before playback');
      return result;
    }
    dispatchCommand(command);
  }

  return await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: findAndClick,
    args: [command, tab.active],
  });
}

async function getSpotifyTab(createIfNotExist = false, focusAndActivate = false, url = 'https://open.spotify.com/') {
  // First check current visible tab - extra processing but makes sure commands
  // executed / animations occur only within active tab & avoids jarring switch
  // to other tab / window.
  let [activeTab] = await chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT });
  let spotifyTab = activeTab;
  if (!spotifyTab || !spotifyTab.url?.startsWith('https://open.spotify.com/')) [spotifyTab] = await chrome.tabs.query({ url: 'https://open.spotify.com/*' });
  if (createIfNotExist && !spotifyTab) {
    // Only create new Spotify tab within most recent non-incognito window.
    let lastNormalWinId = state.winIdStack[0];
    lastNormalWinId ??= (await chrome.windows.create({ focused: false, incognito: false })).id;
    spotifyTab = await chrome.tabs.create({ url, active: false, windowId: lastNormalWinId });
  }
  // Use expando prop on found tab to record combined tab.active & window.focus
  // states (before explicitly focusing if required below).
  if (spotifyTab) spotifyTab.focusedAndActive = spotifyTab.active && (await chrome.windows.get(spotifyTab.windowId))?.focused;
  if (!spotifyTab || !focusAndActivate) return spotifyTab;

  if (!spotifyTab.focusedAndActive) {
    chrome.windows.update(spotifyTab.windowId, { focused: true });
    chrome.tabs.update(spotifyTab.id, { active: true });
  }
  return spotifyTab;
}

chrome.commands.onCommand.addListener(async function (command) {
  const CREATE = 1, FOCUS = 2;
  const requirements = {
    'go-home': CREATE | FOCUS,
    'go-search': CREATE | FOCUS,
    'play-pause': CREATE,
    'toggle-now-playing': FOCUS,
    'toggle-queue': FOCUS,
    'toggle-lyrics': FOCUS,
  }[command] ?? 0;
  const targetUrl = command === 'go-search' ? 'https://open.spotify.com/search' : undefined;
  const tab = await getSpotifyTab(!!(requirements & CREATE), !!(requirements & FOCUS), targetUrl);
  if (!tab) return;
  if (command === 'go-search' && tab.pendingUrl?.startsWith('https://open.spotify.com/search')) return;
  if (command === 'go-home' && tab.pendingUrl?.startsWith('https://open.spotify.com/')) return;
  const response = await sendCommandToTab(command, tab);
  if (response?.[0]?.result === 'requestUserInteraction') await getSpotifyTab(false, true);
});

chrome.action.onClicked.addListener(async () => {
  await getSpotifyTab(true, true);
});

// Janky MRU tracking for non-incognito windows.
const state = {
  winIdStack: []
};

async function storeState() {
  await chrome.storage.session.set({ state: state })
}

let retrievingState = chrome.storage.session.get('state')
  .then(async (data) => {
    Object.assign(state, data.state);
    if (!state.winIdStack.length) {
      const currentWin = await chrome.windows.getCurrent();
      if (currentWin && !currentWin.incognito) {
        state.winIdStack.push(currentWin.id);
      } else {
        const allWins = await chrome.windows.getAll();
        allWins.filter((win) => !win.incognito);
        if (allWins.length) state.winIdStack.push(allWins[0].id);
      }
    }
    retrievingState = null;
  });

chrome.windows.onFocusChanged.addListener(async (winId) => {
  if (winId === chrome.windows.WINDOW_ID_NONE || (await chrome.windows.get(winId))?.incognito) return;
  if (retrievingState) await retrievingState;
  state.winIdStack.unshift(winId);
  state.winIdStack = [...new Set(state.winIdStack)];
  await storeState();
});

chrome.windows.onRemoved.addListener(async (winId) => {
  if (retrievingState) await retrievingState;
  state.winIdStack = state.winIdStack.filter((i) => i !== winId);
  await storeState();
});

chrome.action.onClicked.addListener(async (tab) => {
  // Hack: scroll to shortcuts for self, using text anchor on the app name.
  // Thanks Chrome for not providing a proper API!
  const title = chrome.i18n.getMessage('application_title')
  await chrome.tabs.create({ url: `chrome://extensions/shortcuts#:~:text=${title}`, active: true });
});
