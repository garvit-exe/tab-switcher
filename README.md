# Tab Switcher
Tab Switcher is a Chrome extension that lets you quickly switch between tabs using a Spotlight-like overlay. Activate the overlay with a keyboard shortcut, type in either a tab index or a search string (with fuzzy matching), and switch to the desired tab—all without leaving your keyboard.
> **Note: This extension works only on regular web pages. It does not activate on chrome:// pages.**
## Features
- **Keyboard Shortcut Activation:**
    - **Windows/Linux:** Control+Space
    - **Mac:** Option+Space
- **Overlay UI:**
    - A modern, responsive overlay appears over the current page.
    - Uses a Shadow DOM for style isolation.
- **Input Handling:**
    - Type a number (e.g. `3`) to switch to that tab index (1-based). If the number is higher than the number of tabs, the last tab is activated.
    - Type text to fuzzy-match tab titles.
    - Enclose your input in quotes (e.g. `"123"`) to force it to be treated as text even if it is numeric.
## Installation
1. **Download or Clone the Repository:**
    ```bash
    git clone https://github.com/garvit-exe/tab-switcher.git
    ```
    or download the ZIP file and extract it.
2. **Load the Extension in Chrome:**
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable **Developer mode** (toggle in the top-right corner).
    - Click on **Load unpacked** and select the folder containing the extension files.
3. **Set Shortcut (if needed):**
    - The default shortcuts are defined in the manifest:
        - Windows/Linux: `Ctrl+Space`
        - Mac: `Alt+Space`
    - You can adjust these in the manifest if desired.
## How to Use
1. **Activate the Overlay:**
    - Press the shortcut key (Ctrl+Space on Windows/Linux or Option+Space on macOS).
    - The Spotlight-like overlay will appear.
2. **Enter Your Query:**
    - **Numeric Input:** Type a number (e.g. `3`) and press **Enter** to switch to the tab at that index (1-based). If the number is greater than the available tab count, the last tab will be selected.
    - **Text Input:** Type a search string to fuzzy-match tab titles and press Enter to activate the best match.
    - **Force Text Mode:** Wrap your input in quotes (using double, single, or backticks) to treat it as text even if it’s numeric (e.g. `"123"`).
3. **Dismiss the Overlay:**
    - Press **Escape** or click outside the overlay to close it without taking any action.
## File Structure
- **manifest.json:**<br />
    Defines the extension’s metadata, permissions, background service worker, and keyboard shortcuts.
- **background.js:**
    - Contains:
        - The command listener for shortcut activation.
        - Logic to inject the overlay into the current tab.
        - Message listeners that handle switching tabs based on index or fuzzy title matching.
        - A helper function (`getBestMatchTab`) that performs fuzzy matching.
- **overlay.html:**<br />
    Provides a fallback UI for chrome:// pages (if needed). Currently, the extension warns and does not activate on chrome:// pages.
## Customization
- **Changing Shortcuts:**<br />
    Update the `"commands"` section in the manifest.
- **Styling the Overlay:**<br />
    Modify the CSS within the `<style>` blocks in both `background.js` (in the injected overlay) and `overlay.html`.
- **Fuzzy Matching Behavior:**<br />
    The `getBestMatchTab` function in `background.js` can be adjusted to improve or change how fuzzy matching works.
