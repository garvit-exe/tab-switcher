// Listen for the keyboard shortcut command.
chrome.commands.onCommand.addListener((command) => {
    if (command === "activate-spotlight") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs.length) {
                console.error("No active tab found.");
                return;
            }
            const activeTab = tabs[0];

            // If the active tab is a chrome:// page, we warn and do nothing.
            if (activeTab.url.startsWith("chrome://")) {
                console.warn("Cannot activate overlay on chrome:// pages.");
                return;
            }

            // Inject the overlay into the active tab.
            chrome.scripting.executeScript(
                {
                    target: { tabId: activeTab.id },
                    function: showOverlay,
                },
                (injectionResults) => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Script injection failed:",
                            chrome.runtime.lastError
                        );
                    }
                }
            );
        });
    }
});

// Listen for messages from the injected overlay.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const queryOptions = { currentWindow: true };

    if (message.action === "activateTabByIndex") {
        chrome.tabs.query(queryOptions, (tabs) => {
            let targetIndex = message.index;
            // If the provided index is too high, select the last tab.
            if (targetIndex >= tabs.length) {
                targetIndex = tabs.length - 1;
            }
            // Error handling if no tab is available.
            if (!tabs[targetIndex]) {
                console.error("No tab found at index:", targetIndex);
                return;
            }
            chrome.tabs.update(tabs[targetIndex].id, { active: true });
        });
    } else if (message.action === "activateTabByTitle") {
        chrome.tabs.query(queryOptions, (tabs) => {
            const bestMatchTab = getBestMatchTab(message.query, tabs);
            if (bestMatchTab) {
                chrome.tabs.update(bestMatchTab.id, { active: true });
            } else {
                console.warn("No matching tab found for query:", message.query);
            }
        });
    }
    return true;
});

/**
 * getBestMatchTab: Modularized function to perform fuzzy matching on tab titles.
 * It selects the tab that has the query at the earliest position. In case of ties,
 * it returns the tab with the lowest index.
 *
 * @param {string} query - The search query.
 * @param {Array} tabs - Array of tab objects.
 * @returns {Object|null} - The best matching tab, or null if no match found.
 */
function getBestMatchTab(query, tabs) {
    const lowerQuery = query.toLowerCase();
    let bestMatch = null;
    let bestScore = Infinity;
    let bestIndex = Infinity;

    tabs.forEach((tab, index) => {
        const title = tab.title.toLowerCase();
        const pos = title.indexOf(lowerQuery);
        if (pos !== -1) {
            if (pos < bestScore || (pos === bestScore && index < bestIndex)) {
                bestScore = pos;
                bestMatch = tab;
                bestIndex = index;
            }
        }
    });
    return bestMatch;
}

/**
 * showOverlay: Injected into non‑chrome:// pages, creates the Spotlight overlay.
 * Uses Shadow DOM for style isolation and captures input to switch tabs.
 */
function showOverlay() {
    // Check if the overlay already exists (toggle behavior).
    const existingOverlay = document.getElementById("spotlight-overlay");
    if (existingOverlay) {
        existingOverlay.remove();
        return;
    }

    // Create the full-screen overlay.
    const overlay = document.createElement("div");
    overlay.id = "spotlight-overlay";
    Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "999999",
    });

    // Create a host element and attach a Shadow DOM to isolate styles.
    const containerHost = document.createElement("div");
    const shadowRoot = containerHost.attachShadow({ mode: "open" });

    // Create the container that holds the input.
    const container = document.createElement("div");
    container.className = "container";

    // Define responsive, modern CSS for the container and input.
    const style = document.createElement("style");
    style.textContent = `
      .container {
        background: rgba(255, 255, 255, 0);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        padding: 24px 32px;
        width: 100%;
        max-width: 800px;
        text-align: center;
        font-family: 'Roboto', sans-serif;
        opacity: 0;
        transform: translateY(-40px);
        animation: slideDown 0.4s ease-out forwards;
      }
      @keyframes slideDown {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      input {
        width: 100%;
        font-size: 20px;
        padding: 14px 20px;
        border: none;
        border-radius: 8px;
        outline: none;
        box-sizing: border-box;
        color: #333;
        background: rgba(255, 255, 255, 1);
        box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s ease;
      }
      input:focus {
        box-shadow: 0 0 0 3px #3f8efc;
      }
      /* Responsive adjustments for smaller screens */
      @media (max-width: 600px) {
        .container {
          width: 100%;
          padding: 16px 20px;
        }
        input {
          font-size: 18px;
          padding: 12px 16px;
        }
      }
    `;

    // Create the input field.
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter tab index or title...";

    // Assemble the Shadow DOM.
    shadowRoot.appendChild(style);
    container.appendChild(input);
    shadowRoot.appendChild(container);
    overlay.appendChild(containerHost);
    document.body.appendChild(overlay);

    // Focus the input field after rendering.
    setTimeout(() => {
        input.focus();
    }, 0);

    // Capture key events on the input.
    input.addEventListener("keydown", function (e) {
        e.stopPropagation();
        if (e.key === "Enter") {
            e.preventDefault();
            let query = input.value.trim();
            if (query) {
                // Check if the query is wrapped in quotes.
                let treatAsText = false;
                if (
                    (query.startsWith('"') && query.endsWith('"')) ||
                    (query.startsWith("'") && query.endsWith("'")) ||
                    (query.startsWith("`") && query.endsWith("`"))
                ) {
                    treatAsText = true;
                    // Remove the wrapping quotes and trim any extra whitespace.
                    query = query.slice(1, query.length - 1).trim();
                }
                // If not quoted and the query is all digits, treat as index.
                if (!treatAsText && /^\d+$/.test(query)) {
                    chrome.runtime.sendMessage({
                        action: "activateTabByIndex",
                        index: parseInt(query, 10) - 1,
                    });
                } else {
                    chrome.runtime.sendMessage({
                        action: "activateTabByTitle",
                        query: query,
                    });
                }
            }
            overlay.remove();
        } else if (e.key === "Escape") {
            e.preventDefault();
            overlay.remove();
        }
    });

    // Remove the overlay if clicking outside the container.
    overlay.addEventListener("click", function (e) {
        if (!e.composedPath().includes(container)) {
            overlay.remove();
        }
    });
}
