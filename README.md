# Unique ID Manager for Google Sheets (with API Integration)

This project is a comprehensive Google Apps Script application that provides a robust solution for generating, assigning, and managing the lifecycle of unique IDs, directly within the Google Sheets environment. It is designed to automate processes that are often manual, error-prone, and time-consuming.

The application features an integrated user interface, advanced business logic, a connection to an external API, and automated maintenance routines, making it a full-stack solution within the Google Workspace ecosystem.

## Key Features

This project implements several key features:

* **Integrated User Interface**: A custom menu and a modal dialog box built with HTML/CSS/JS provide an intuitive experience for users directly within their spreadsheet.

* **Structured ID Generation**: Implements a custom algorithm to create unique identifiers that follow a specific format (Prefix + Sequential Base + Control Key/Checksum), ensuring their validity and uniqueness.

* **Data Pool Management**: The script intelligently reuses archived IDs before generating new ones, thus optimizing resource utilization.

* **Third-Party API Integration**:
    * Securely connects to an external API via the OAuth2 (Client Credentials) authentication flow.
    * Fetches data to enrich or validate internal information.
    * Recommends secure secret management (Client ID/Secret) using `PropertiesService`.

* **Data Cross-Validation**: An automated function compares IDs present in the Google Sheet against data from the external source (API) and updates a validity status, ensuring data consistency.

* **Data Lifecycle Management**: An automatic archiving process moves "expired" records (based on a configurable period) from the active log to a history log, keeping the main worksheet clean and performant.

## Tech Stack & Tools

* **Google Apps Script** (based on JavaScript ES5/ES6)
* **Google Workspace APIs**:
    * `SpreadsheetApp`: For all interactions with Google Sheets.
    * `HtmlService`: To serve the web-based user interface.
    * `UrlFetchApp`: To make HTTP calls to the external API.
    * `PropertiesService`: For the secure management of API secrets.
* **HTML5 / CSS3**: For the structure and styling of the user interface.
* **JavaScript (Client-Side)**: For the interactive logic within the dialog box.

## Getting Started

To deploy and test this project:

1.  **Create a Google Sheet**: Start with a new Google Sheet.
2.  **Open the Script Editor**: Navigate to `Extensions` > `Apps Script`.
3.  **Copy the Code**:
    * Create one or more `.gs` files for the server-side code (it is recommended to separate the logic: `Code.gs` for main functions, `API.gs` for integration, `Logic.gs` for generation, etc.).
    * Create an `.html` file for the user interface (`DialogUI.html`).
    * Copy and paste the content of the anonymized scripts into the corresponding files.
4.  **Set Up the Google Sheet**:
    * Create the required sheets with the exact names used in the code:
        * `Journal_Attribution` (Assignment_Log)
        * `Pool_Donnees` (Data_Pool)
        * `Journal_Historique` (History_Log)
        * `Import_API_Resultats` (API_Import_Results)
5.  **Configure API Secrets**:
    * **Never** hardcode your secrets in the script. In the Apps Script editor, go to `Project Settings` (⚙️ icon) and add "Script Properties".
    * Add `API_CLIENT_ID` and `API_CLIENT_SECRET` with their respective values.
    * Ensure your code uses `PropertiesService.getScriptProperties().getProperty('API_CLIENT_ID')` to retrieve them.
6.  **Run the Application**:
    * From the Apps Script editor, select the `onOpen` function from the dropdown and run it once to create the custom menu.
    * Reload your Google Sheet. The new "Custom Tools" menu should appear.

## How to Use

1.  Open the Google Sheet.
2.  Click on `Custom Tools` > `Run Action`.
3.  In the dialog box, enter the number of IDs you need and click `Generate`.
4.  The generated IDs will appear. Click `Save` to confirm them and write them to the `Journal_Attribution` sheet.
5.  For automated tasks (like validation and archiving), you can set up **Triggers** from the Apps Script editor (⏰ icon) to run them on a recurring basis (e.g., daily).

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
