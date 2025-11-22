// Runs when you click the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab.id) return;

    // (Optional) Light guard: only run on NotebookLM
    const url = tab.url || "";
    const allowed = /^https:\/\/(www\.)?notebooklm\.google\.com\//.test(url);
    if (!allowed) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => alert("Please open notebooklm.google.com (project list) first, then click the extension again.")
      });
      return;
    }

    // Inject the deleter into the page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        // Constants
        const MENU_ARIA_LABELS = [
          "プロジェクトの操作メニュー",     // JP
          "Project Actions Menu",          // EN
          "More actions",                  // fallback
        ];
        const DELETE_TEXTS = ["削除", "Delete"];

        // Helpers
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));

        const findButtonByText = (texts, filterFn = () => true) => {
          const buttons = Array.from(document.querySelectorAll("button"));
          return buttons.find((b) => {
            const t = (b.innerText || "").trim();
            return texts.some((x) => t.includes(x)) && filterFn(b);
          });
        };

        const getMenuButtons = () => {
          for (const label of MENU_ARIA_LABELS) {
            const found = Array.from(document.querySelectorAll(`button[aria-label="${label}"]`));
            if (found.length) return found;
          }
          return [];
        };

        // Main Logic
        if (!confirm("⚠️ This will delete ALL your NotebookLM notebooks/projects on this page. Proceed?")) {
          return;
        }

        console.log("Starting deletion process...");

        while (true) {
          const menuButtons = getMenuButtons();

          if (menuButtons.length === 0) {
            console.log("No notebooks found (menu buttons not present). Stopping.");
            break;
          }

          // Click the first (newest) menu button
          const button = menuButtons[0];
          button.click();
          await delay(300);

          // Click "Delete" in the opened menu
          const deleteButton = findButtonByText(DELETE_TEXTS, (b) => !b.getAttribute("type"));
          if (!deleteButton) {
            console.log("Could not find a 'Delete' option in the menu. Stopping.");
            // Close menu to avoid getting stuck? Or just break.
            // Clicking elsewhere might be needed if we wanted to continue, but let's stop to be safe.
            break;
          }
          deleteButton.click();
          await delay(300);

          // Click "Delete" in the confirmation dialog
          const confirmButton = findButtonByText(DELETE_TEXTS, (b) => (b.getAttribute("type") || "") === "submit");
          if (confirmButton) {
            confirmButton.click();
            await delay(1000); // Wait for deletion and list refresh
          } else {
            console.log("Could not find confirmation 'Delete' button. Stopping.");
            break;
          }
        }

        console.log("Done. If items remain, please scroll down to load more and run the extension again.");
      }
    });
  } catch (e) {
    console.error("Extension error:", e);
  }
});
