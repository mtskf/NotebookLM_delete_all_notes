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
          "Menü mit Projektaktionen"     // DE
        ];
        const DELETE_TEXTS = ["削除", "Delete", "Löschen"]; // JP, EN, DE (fallback)

        // Helpers
        const waitFor = (selectorFn, timeout = 3000) => new Promise((resolve) => {
          const el = selectorFn();
          if (el) return resolve(el);

          const timer = setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
          const observer = new MutationObserver(() => {
            const el = selectorFn();
            if (el) {
              clearTimeout(timer);
              observer.disconnect();
              resolve(el);
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        });

        const waitForRemoval = (selectorFn, timeout = 5000) => new Promise((resolve) => {
          if (!selectorFn()) return resolve();

          const timer = setTimeout(() => { observer.disconnect(); resolve(); }, timeout);
          const observer = new MutationObserver(() => {
            if (!selectorFn()) {
              clearTimeout(timer);
              observer.disconnect();
              resolve();
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        });

        const getMenuButtons = () => {
          for (const label of MENU_ARIA_LABELS) {
            const found = Array.from(document.querySelectorAll(`button[aria-label="${label}"]`));
            if (found.length) return found;
          }
          return [];
        };

        const findDeleteMenuItem = () => {
          const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
          return items.find((item) => {
            const text = (item.innerText || "").trim();
            return DELETE_TEXTS.some((d) => text.includes(d));
          });
        };

        const findConfirmButton = () => {
          const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
          return buttons.find((b) => {
            const text = (b.innerText || "").trim();
            return DELETE_TEXTS.some((d) => text.includes(d));           
          });
        };

        const ensureListPage = async () => {
          if (location.pathname.startsWith("/notebook/")) {
            console.log("[NotebookLM Deleter] Navigated away from list. Returning...");
            const params = new URLSearchParams(location.search);
            const authuser = params.get("authuser") || "0";
            location.href = "/?authuser=" + authuser;
            await new Promise((r) => setTimeout(r, 3000));
            return false;
          }
          return true;
        };

        // Main Logic
        console.log("[NotebookLM Deleter] Starting deletion process...");

        while (true) {
          // Guard: if Angular navigated to a notebook page, go back to the list
          if (!(await ensureListPage())) continue;

          // Wait for menu buttons to appear (Angular may be re-rendering the list)
          const firstMenu = await waitFor(() => getMenuButtons()[0] || null, 3000);

          if (!firstMenu) {
            console.log("[NotebookLM Deleter] No notebooks found. Stopping.");
            break;
          }

          // Click the first (newest) menu button — stop propagation to prevent
          // Angular's PROJECT-BUTTON from navigating to the notebook page
          firstMenu.dispatchEvent(new MouseEvent("click", { bubbles: false }));

          // Wait for delete menu item to appear
          const deleteItem = await waitFor(findDeleteMenuItem);
          if (!deleteItem) {
            console.log("[NotebookLM Deleter] Could not find 'Delete' in menu. Stopping.");
            document.body.click(); // close menu
            break;
          }
          deleteItem.click();

          // Wait for confirmation dialog's submit button
          const confirmBtn = await waitFor(findConfirmButton);
          if (!confirmBtn) {
            console.log("[NotebookLM Deleter] Could not find confirmation button. Stopping.");
            break;
          }
          confirmBtn.click();

          // Wait for the confirmation dialog to close
          await waitForRemoval(
            () => document.querySelector('mat-dialog-container, [role="dialog"]')
          );
        }

        console.log("Done. If items remain, please scroll down to load more and run the extension again.");
      }
    });
  } catch (e) {
    console.error("Extension error:", e);
  }
});
