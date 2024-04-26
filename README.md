# Enhanced GOG Userscript

![screenshot](https://raw.githubusercontent.com/kevinfiol/enhanced-gog/master/img/screenshot.jpg)

### [GOG Community Discussion Thread](https://www.gog.com/forum/general/enhanced_gog_userscript_adds_isthereanydeal_integration_to_game_pages)

A userscript that aims to improve the overall experience browsing [GOG.com](https://gog.com). `enhanced-gog` helps you always find the lowest prices on games by displaying:

* Current lowest price available from GOG, or other digital distributors
* All-time historically lowest price
* All-time historically lowest price from GOG.com itself
* Number of times a game has been in a video game bundle
* A Country & Region selector to dynamically load latest price data

Data graciously provided by [IsThereAnyDeal](https://isthereanydeal.com).

## Install

1. Install a Userscript Manager
    * Chrome: [Violentmonkey](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag) or [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    * Firefox: [Violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/) or [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
    * Opera: Download Violentmonkey or Tampermonkey from the Chrome Web Store

Note: I recommend Violentmonkey since it is Free, Open-Source, and light on system resources. Tampermonkey is good, but it is proprietary.

2. **[Click here to install the userscript](https://raw.githubusercontent.com/kevinfiol/enhanced-gog/master/bin/enhanced-gog.user.js)**

## Building

If you want to build a custom version of the script from the sources:

1. Install [Node.js](https://nodejs.org/)
2. From the root directory, run `npm install` to install the dependent packages
3. Next run `npm run build` to build the script. The compiled script will be in 'bin/enhanced-gog.user.js`
