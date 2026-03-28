# NotebookLM: Delete All Notebooks

**NotebookLM: Delete All Notebooks** is a Chrome extension that allows you to delete all notebooks/projects in [NotebookLM](https://notebooklm.google.com/) with a single click.

> [!WARNING]
> **This is a destructive operation.** There is no undo. All visible notebooks will be deleted.

## Features
- **Bulk Deletion**: Deletes all notebooks visible on the page, starting from the newest.
- **Fast**: Uses MutationObserver for instant DOM change detection (~0.2s per notebook).
- **Multi-Language Support**: Works with both English and Japanese interfaces.

## Installation

1.  **Download/Clone** this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked** and select the directory containing this extension.
5.  (Optional) Pin the extension icon to your toolbar for easy access.

## Usage

1.  Go to [https://notebooklm.google.com/](https://notebooklm.google.com/) to view your project list.
2.  Click the **NotebookLM: Delete All Notebooks** extension icon.
3.  The extension will automatically delete notebooks one by one.

> [!TIP]
> If you have a large number of notebooks and the list is virtualized (lazy loaded), you may need to scroll down to load more items and run the extension again.

## Troubleshooting

If the extension doesn't seem to work:
1.  **Refresh the page**: Sometimes the page state needs to be reset.
2.  **Check Language**: The extension supports English and Japanese. If you use another language, the "Delete" button might not be recognized.
3.  **Inspect Console**: Right-click the page -> Inspect -> Console. Look for messages starting with "Extension error" or logs about missing buttons.

## Permissions

-   `scripting`: Required to inject the deletion script into the NotebookLM page.
-   `activeTab`: Required to access the current tab when the extension icon is clicked.
-   `host_permissions`: Restricted to `https://notebooklm.google.com/*` and `https://www.notebooklm.google.com/*`.

## Disclaimer

This extension is not affiliated with Google or NotebookLM. Use it at your own risk. Always double-check before deleting important data.
