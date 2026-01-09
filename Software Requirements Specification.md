Here is the complete Software Requirements Specification (SRS) document, updated to version 2.1, reflecting all the architectural decisions and clarifications discussed, including the implementation of Pancha Bhoota Sthalam album identification logic.

***

### **Software Requirements Specification: Thirupugazh Song List Generator**
**Version:** 3.4
**Date:** December 31, 2025

---
### 1. Introduction

#### 1.1 Purpose
This document specifies the requirements for the Thirupugazh Song List Generator. The application's primary objective is to automate the creation of structured, timed playlists for bhajan sessions by adhering to a specific 16-step thematic sequence, while providing comprehensive event management capabilities including prayer selection, function scheduling, and host member coordination, thereby saving significant manual preparation time for organizers.

#### 1.2 Scope
The system will consist of a client-side web application and a server-side Node.js backend. The web interface will allow users to generate playlists with comprehensive event details including prayer selection, function/occasion specification, bhajan scheduling details, and host member coordination. The backend will house a rule-based engine to construct playlists according to the strict sequence, manage persistent history in a MySQL database, and securely interact with LLM services. The scope includes glassmorphism UI design, comprehensive event management, enhanced PDF generation with headers, and robust error handling.

#### 1.3 Latest Updates (Version 3.4 - December 31, 2025)
* **Intelligent PDF Filename Generation:** PDF files now automatically generated with descriptive names in format: `Occasion_DD-MM-YYYY_Day_HHMM[AM/PM]_HHMM[AM/PM].pdf` (e.g., `குரு_பூர்ணிமா_30-10-2025_Thursday_0800AM_1000AM.pdf`). Filenames incorporate function/occasion name, date (day-month-year), day of week, and time range in 12-hour format with AM/PM designation for easy identification and organization.
* **Optimized PDF Rendering:** Enhanced PDF generation with html2pdf.js best practices:
  - **High-Resolution Output:** Increased canvas scale from 1.5 to 4 for sharper text and finer border rendering
  - **Thin Borders:** Implemented 0.5pt solid borders with light gray (#ccc) color for professional appearance
  - **Border-Collapse:** Proper use of `border-collapse: collapse` with `cellspacing="0"` for clean single-line borders
  - **Calibri 14pt Font:** Professional font sizing with mixed sizes (14pt for song titles, 11pt for Raagam/Hour columns)
* **Improved Pagination:** Optimized row distribution across pages:
  - **First Page:** 38 songs with header panel
  - **Subsequent Pages:** 51 songs per page with 8px top margin to prevent border bleeding
  - **Clean Page Breaks:** Separate tables per page with explicit page break divs preventing content spillage
* **Enhanced Table Formatting:** 
  - **6-Column Layout:** Sl.No (5%), Song Title (45%), Raagam (18%), Song No (18%), Hour (8%), A (6%)
  - **Minimal Cell Padding:** 0px vertical, 1px horizontal for compact layout
  - **Line Height:** 1.0 for tight spacing, allowing maximum content per page
* **Visual Refinements:**
  - **Light Gray Borders:** Subtle #ccc borders replacing heavier #999 for cleaner professional look
  - **Compact Header Panel:** Reduced spacing (11px fonts, 2px margins) to maximize table space
  - **3mm Page Margins:** Minimal margins for maximum content area

#### 1.3.1 Previous Updates (Version 3.3 - October 26, 2025)
* **Header Alignment and Invocation:** Playlist header refined. Invocation spelling standardized to "ஓம் ஸ்ரீ மஹாகணபதயே நமஹ" (not மகாகணபதயே). Invocation appears left/right; Function and Date|Day|Time centered; Host details centered.
* **Bhajan Details Layout:** Fixed grid widths (2-2-3-3-2) and input-group sizing so Date, Day, Start, End, and Duration are fully visible on one row (wraps gracefully on smaller screens).
* **Playlist UI Columns:** Renamed "Alankaaram" column to "A". Hour label compacted to "Hr" (e.g., "1st Hr").
* **PDF Export Overhaul:** PDF now includes only 5 columns in this order: Sl.No, Song Title, Raagam, Song No, A. Borders thinned (~0.35px). Larger bold ✓ for Alankaaram. Added centered header panel with invocation, prarthanai, function, date|day|time, and host. Repeating column headers on each page; minimized first-page whitespace.
* **Fonts and Margins:** Uses 'Noto Sans Tamil' stack. A4 portrait with minimal margins (~5mm).
* **Six Main Abodes Enhancement:** Updated playlist generation algorithm for the 6 main abodes of Murugan:
  - **Five Traditional Abodes:** Each now provides 2 songs (was 1): திருப்பரங்குன்றம், திருசெந்தூர், திருப்பழனி, ஸ்வாமி மலை, திருத்தணிகை
  - **பழமுதிர் சோலை:** Now provides 2 songs (was 1)
  - **Total Enhancement:** 12 songs from 6 main abodes (increased from 6 songs)
  - **குன்றுதோறாடல்:** Continues with 1 song as before
  - **Sequence Preservation:** Maintains identical step order and logic
* **Improved Duration Accuracy:** Enhanced playlist generation algorithm with precision targeting:
  - **5% Variance Tolerance:** Algorithm now maintains playlist duration within 5% of requested target
  - **Intelligent Calculation:** Uses actual song durations from database for accurate time estimation
  - **Real-time Feedback:** System provides clear logging of duration accuracy and suggestions for adjustments
* **Professional PDF Generation:** Complete overhaul of PDF export functionality:
  - **Enhanced Header Formatting:** Clean, center-aligned headers without labels, matching playlist section format
  - **Header Repetition:** Headers automatically repeat on every page when content spans multiple pages
  - **Improved Table Borders:** Properly closed table borders preventing content spillage between pages
  - **Content Cleanup:** Removed unnecessary generated timestamps and footer text for cleaner professional appearance
  - **16pt Bold Font:** Enhanced readability with larger, bold fonts throughout PDF documents
  - **Simplified Alankaaram Display:** Alankaaram column now shows only tick mark (✓) without time duration for cleaner professional appearance

#### 1.4 Major Updates (Version 3.0)
* **Glassmorphism UI Design:** Complete visual redesign with frosted glass aesthetic, animated gradient backgrounds, backdrop filters, and enhanced visual depth throughout the application.
* **Comprehensive Event Management System:** Added three new input sections for complete bhajan event coordination:
  - **Prarthanai Selector:** Interactive prayer selection with preview buttons showing first 2-3 words of each prayer text
  - **Function Selector:** Comprehensive occasion/function selection from predefined list of 31 Tamil festival functions
  - **Bhajan Details Section:** Date/time selection with auto-populated day field and complete member management system
* **Enhanced Playlist Generation Logic:** Added new Step 5f in the 16-step sequence for குன்றுதோறாடல் album selection, positioned after திருத்தணிகை but before Pancha Bhoota Sthalams.
* **Advanced PDF Generation:** Complete redesign with portrait orientation, 16pt font sizing, reduced margins (0.5 inches), and comprehensive header inclusion displaying prayer text, function details, scheduling information, and host member details.
* **Member Management System:** Complete member database integration with contact details, address information, and phone numbers for event coordination.
* **Enhanced Header Display:** Playlist interface now includes comprehensive event headers displaying all selected information above the song list for complete event documentation.

#### 1.5 Previous Updates (Version 2.7)
* **PDF Readability Enhancement:** Improved PDF font sizes from 9px to 12px body text and 8px to 10px table cells for better accessibility, especially for older users. Removed 1-page restriction, allowing up to 2 A4 pages for optimal readability.
* **Enhanced PDF Margins:** Increased margins from 0.3in to 0.5in and improved spacing for better visual comfort and reading experience.
* **Zero Zoom Factor:** Removed aggressive 0.85 zoom factor compression, now using 1.0 for natural text sizing and improved legibility.

#### 1.6 Previous Updates (Version 2.6)
* **Album Hierarchy Correction:** Fixed பொதுப் பாடல்கள் (Pothu Paadalgal) positioning from end of sequence to Step 6 (after Five Abodes, before Pancha Bhoota) as per original SRS requirements.
* **Enhanced 16-Step Sequence:** Extended from 13-step to 16-step sequence by adding three new compulsory albums after வகுப்பு: பூஜோபசாரங்கள், ஏறுமயில், and ப்ரார்த்தனை.
* **Missing Album Assignment Fix:** Corrected album assignments for ஏறுமயில் and ப்ரார்த்தனை songs in songs.js database.
* **PDF Layout Optimization:** Implemented readable A4 formatting with appropriately sized fonts for accessibility, allowing up to 2 pages for better readability, especially for older users.
* **Album Name Mapping Enhancement:** Added English-to-Tamil mappings for new compulsory albums (poojopacharangal, erumayil, prarthana) in both frontend and backend systems.

#### 1.7 Previous Updates (Version 2.5)
* **PDF Export Form Button Fix:** Fixed critical issue where PDF export button was triggering new playlist generation due to missing `type="button"` attribute. Export now properly uses the existing playlist without creating a new one.
* **Comprehensive Documentation Update:** Added missing requirements for implemented features including song search API, keyboard shortcuts, loading states, error handling, multiple LLM provider support, and database auto-initialization.
* **Enhanced API Documentation:** Documented health check endpoint, search functionality, and environment variable requirements.
* **Security and Performance Requirements:** Added requirements for input validation, error handling, and timeout management.

#### 1.8 Previous Updates (Version 2.3)
* **Enhanced பொதுப் பாடல்கள் Requirements:** Modified the playlist generation algorithm to require a minimum of 3 songs from the "பொதுப் பாடல்கள்" album in every generated playlist. This ensures adequate representation of general devotional songs while maintaining the existing time-filling logic for additional songs beyond the minimum requirement.

#### 1.9 Previous Updates (Version 2.2)
* **Enhanced AI Chatbot Interface:** Upgraded from single-line text input to multi-line textarea for improved user experience with complex commands.
* **AI Assistant Commands Guide:** Added comprehensive user guidance including available commands, examples, and behavioral explanations.
* **UI Reorganization:** Streamlined interface by consolidating action buttons (Export PDF, Clear Playlist) below the Generate Playlist button, removing the separate Quick Actions card.
* **Enhanced User Feedback:** Improved messaging system to clearly explain song repositioning behavior according to the 16-step hierarchy.
* **Album-Specific Documentation:** Added specific explanations for special cases like கந்தர் அனுபூதி album containing only one comprehensive song.
* **Replace Functionality Clarification:** Enhanced user understanding of replace operations and automatic song repositioning.

#### 1.10 Previous Updates (Version 2.1)
* **Pancha Bhoota Sthalam Implementation:** Clarified and implemented the identification logic for Pancha Bhoota Sthalam albums. The system now automatically identifies albums whose names start with "பஞ்சபூதம் " prefix and includes up to 5 songs from these albums in the playlist generation sequence.

---
### 2. Overall Description & System Architecture

#### 2.1 Product Perspective
The application is a client-server system.
* **Client:** A self-contained, client-side web application that operates entirely within the user's browser, responsible for rendering the UI and handling user interactions.
* **Server:** A Node.js backend application responsible for the core business logic, including playlist generation, database communication with MySQL, and secure proxying of requests to the LLM API.

#### 2.2 Design and Implementation Constraints

**UI-C1: Styling and Technology**
* The user interface must be styled using the Bootstrap 5 framework and custom CSS3 to achieve a modern glassmorphism aesthetic with professional appearance.
* The application must implement comprehensive glassmorphism design principles including animated gradient backgrounds, backdrop blur effects, and semi-transparent layered elements.

**UI-C1.1: Glassmorphism Design Requirements**
* Animated gradient background using white, gray, and silver color transitions with CSS keyframe animations for elegant, professional appearance
* Backdrop filter blur effects (minimum 10px) applied to all primary containers and cards for frosted glass aesthetic
* Semi-transparent backgrounds using rgba() color values for layered depth with white/gray/silver color scheme
* Enhanced text readability through strategic text shadows and high contrast colors optimized for accessibility
* Interactive elements with glass-like hover effects and subtle transformations maintaining professional elegance
* Smooth color transitions between white (#ffffff), light gray (#f8f9fa), medium gray (#e9ecef), and silver (#ced4da) tones

**UI-C2: Layout and Responsiveness**
* The main application container must be configured to occupy 98% of the browser's viewport width.
* The primary layout must be a two-column design with specific relative widths for desktop views:
    * The Left Column (Control Panel) must occupy 45% of the container's width.
    * The Right Column (Results Panel) must occupy 55% of the container's width.
* The application must be fully responsive. On smaller screens, the two columns should stack vertically.

**DEV-C1: Code Modularity**
* The application logic in both the client-side `script.js` and the Node.js backend must be architected in a modular fashion. Functionality should be broken down into well-named, single-responsibility functions.

**DEV-C2: Project File Structure**
* The project must be composed of the following files:
    * **Frontend:** `index.html`, `style.css`, `script.js`, `songs.js`, `prarthanais.js`, `functions.js`, `members.js`
    * **Backend:** `server.js` (or similar entry point), `package.json`, `.env`
    * **Documentation:** `Software Requirements Specification.md`, `README.md`, `SETUP_INSTRUCTIONS.md`

**DEV-C3: Separation of Concerns (SoC)**
* A strict separation between structure (HTML), presentation (CSS), and behavior (JavaScript) must be enforced.
    * **HTML (`index.html`):** Must be used exclusively for defining the semantic structure of the web page.
    * **JavaScript (`script.js`):** Must be used exclusively for client-side logic (UI updates, event handling, API calls to the backend). It must not contain hardcoded HTML markup strings.
    * **CSS (`style.css`):** Must be used exclusively for defining presentation and layout.
    * **Node.js (Backend):** Must contain all business logic, database interactions, and communication with external services (LLM).

**DEV-C4: Configuration and Security Management**
* Sensitive information, including the LLM API Key and MySQL database credentials, **must not** be stored in the client-side code.
* All sensitive keys and configuration values must be stored on the server-side as **environment variables** (e.g., in a `.env` file that is excluded from version control via `.gitignore`). The Node.js application will load these variables at runtime.

**DATA-C1: Data Sources**
* The `songs.js` file is the definitive, immutable source of truth for all song data. This file is not to be modified by the running application.
* The `prarthanais.js` file contains prayer/devotional text data with unique IDs and full Tamil text content for playlist headers.
* The `functions.js` file contains a comprehensive list of 31 Tamil festival and ceremonial functions/occasions for event categorization.
* The `members.js` file contains the complete member database with contact details, addresses, and phone numbers for 22 bhajan group members.
* The MySQL database is the definitive source for playlist history. It will be read from and written to by the Node.js backend.

**DATA-C3: Event Data Structure**
* Bhajan details must support dual time fields: `startTime` and `endTime` for comprehensive event scheduling
* Time range display shall format as "Start Time - End Time" when both times are provided
* Application state must maintain separate fields for start and end times to support flexible event planning

**DATA-C2: Data Integrity**
* The `duration` field in `songs.js` is stored as a "minutes.seconds" string (e.g., "5.17"). The backend logic must parse this string into a numerical format (total seconds) for any duration calculations.
* The application logic must be robust enough to handle potentially inconsistent or empty values in the `songs.js` data.

---
### 3. Specific Requirements

#### 3.1 Functional Requirements

**FR-1: Event Management System**
* **FR-1.1: Prarthanai Selector:** The system shall provide an interactive prayer selection interface with the following capabilities:
    * **FR-1.1.1: Dynamic Loading:** Automatically load prayer data from `prarthanais.js` file containing prayer verses with unique IDs and full text content
    * **FR-1.1.2: Preview Buttons:** Display clickable buttons showing the first 2-3 words of each prayer text (e.g., "இருநில மீதி...", "துக்கத்தே பரவாமல்...")
    * **FR-1.1.3: Full Text Display:** Upon selection, display the complete prayer text in a dedicated area below the selection buttons
    * **FR-1.1.4: State Management:** Store the selected prayer in application state for inclusion in playlist headers and PDF export
* **FR-1.2: Function Selector:** The system shall provide comprehensive event occasion management with the following features:
    * **FR-1.2.1: Function Database:** Load function/occasion data from `functions.js` containing 31 predefined Tamil festival and ceremonial functions
    * **FR-1.2.2: Card Interface:** Display functions as scrollable, clickable cards with proper visual feedback and selection states
    * **FR-1.2.3: Function Storage:** Store selected function details including ID and name for header generation
* **FR-1.3: Bhajan Details Management:** The system shall provide comprehensive event scheduling capabilities:
    * **FR-1.3.1: Date Selection:** Provide native HTML date picker with automatic day population based on selected date
    * **FR-1.3.2: Start Time Selection:** Provide native HTML time picker for event start time scheduling
    * **FR-1.3.3: End Time Selection:** Provide native HTML time picker for event end time scheduling
    * **FR-1.3.4: Time Range Display:** Display time as "Start Time - End Time" format in headers when both times are provided
    * **FR-1.3.5: Day Auto-Population:** Automatically calculate and display the day of the week when a date is selected
    * **FR-1.3.6: Member Management:** Integrate complete member database from `members.js` with contact details, addresses, and phone numbers
    * **FR-1.3.7: Host Selection:** Provide member selection interface with detailed contact information display upon selection

**FR-2: Enhanced Playlist Generation Engine**
* **FR-1.1: Duration Input:** The user shall be able to input a desired playlist duration in minutes on the web interface.
* **FR-1.2: Strict 16-Step Sequence & Logic:** The playlist generation engine on the Node.js backend must follow this precise algorithm:
    1.  Select one song for each of the compulsory fixed categories (Steps 1-16 below), respecting the repetition avoidance rule (FR-4.2).
        1.  **கைத்தலம் (Compulsory):** The first song must have the exact title "கைத்தலம்".
        2.  **விநாயகர் துதி (1 Additional Song):** The second song must be another, different song selected from the "விநாயகர் துதி" album.
        3.  **விநாயகர் நாமாவளி (1 Song):** The third song must be from the album "விநாயகர் நாமாவளி".
        4.  **குரு வணக்கம் (Compulsory):** The fourth song must be from the album "குரு வணக்கம்".
        5.  **The Five Abodes (2 Songs Each):** The playlist must include 2 songs from each of the following five albums: 'திருப்பரங்குன்றம்', 'திருசெந்தூர்', 'திருப்பழனி', 'ஸ்வாமி மலை', and 'திருத்தணிகை'.
        5f. **குன்றுதோறாடல் (1 Song):** After completing the Five Abodes but before Pancha Bhoota Sthalams, the system must select exactly one song from the "குன்றுதோறாடல்" album, respecting the repetition avoidance rule.
        6.  **பொது பாடல்கள் (Step 6 - Minimum 3 Required):** Select a minimum of 3 songs from the "பொதுப் பாடல்கள்" album, respecting the repetition avoidance rule. This step ensures adequate representation of general devotional songs in the proper sequence position.
        7.  **Pancha Bhoota Sthalams (Up to 5 Songs):** Include one song from each album whose name starts with "பஞ்சபூதம் " (up to 5 such albums). The system shall automatically identify and select from albums like "பஞ்சபூதம் காஞ்சீபுரம்", "பஞ்சபூதம் திரு சிதம்பரம்", etc.
        8.  **பழமுதிர் சோலை (2 Songs):** Include 2 songs from the album "பழமுதிர் சோலை".
        9.  **கந்தர் அனுபூதி (Compulsory):** One song from the album "கந்தர் அனுபூதி".
        10. **வே, ம, சே (Compulsory):** One song from the album "வே, ம, சே".
        11. **விரு (Compulsory):** One song from the album "விரு".
        12. **மகுடம் (Compulsory):** One song from the album "மகுடம்".
        13. **வகுப்பு (Compulsory):** One song from the album "வகுப்பு".
        14. **பூஜோபசாரங்கள் (Compulsory):** One song from the album "பூஜோபசாரங்கள்".
        15. **ஏறுமயில் (Compulsory):** One song from the album "ஏறுமயில்".
        16. **ப்ரார்த்தனை (Compulsory):** One song from the album "ப்ரார்த்தனை".
    2.  Calculate the total duration of all songs selected in Step 1.
    3.  Subtract this duration from the user's total desired duration to determine the `time_to_fill`.
    4.  **Additional பொது பாடல்கள் (Filler Songs):** If the `time_to_fill` is positive after completing all 16 mandatory steps, continue to randomly select additional songs from the "பொதுப் பாடல்கள்" album until the desired duration is met or exceeded.

**FR-2.1: Header Data Integration:** The playlist generation engine shall collect and integrate event management data with the following requirements:
    * **FR-2.1.1: Data Collection:** Gather selected prayer text, function details, bhajan scheduling information, and host member details from the user interface
    * **FR-2.1.2: Header Generation:** Include comprehensive event headers in both web interface display and PDF export containing all collected event information
    * **FR-2.1.3: State Persistence:** Maintain header data throughout the user session for consistent display and export capabilities

**FR-3: Glassmorphism UI Design System**
* **FR-3.1: Visual Aesthetic Requirements:** The system shall implement a comprehensive glassmorphism design with the following specifications:
    * **FR-3.1.1: Animated Background:** Implement animated gradient background with shifting colors (purple, blue, pink, red) using CSS keyframe animations
    * **FR-3.1.2: Backdrop Filters:** Apply `backdrop-filter: blur(10px)` to all primary containers and panels for frosted glass effect
    * **FR-3.1.3: Semi-Transparent Elements:** Use `rgba()` color values with transparency for layered visual depth
    * **FR-3.1.4: High Contrast Text:** Implement text shadows and high contrast colors to ensure readability over glass effects
* **FR-3.2: Interactive Elements:** All interactive components shall include enhanced glassmorphism styling:
    * **FR-3.2.1: Button Effects:** Buttons shall have glass-like appearance with hover transformations and backdrop blur
    * **FR-3.2.2: Card Interactions:** Cards shall feature hover effects with increased transparency and subtle movement
    * **FR-3.2.3: Form Controls:** Input fields and form elements shall have translucent backgrounds with blur effects

**FR-4: AI Chatbot Operations**
* **FR-2.1: Enhanced Input Interface:** The system shall provide a multi-line textarea input field to support complex, multi-command user requests and improve usability for longer instructions.
* **FR-2.2: User Guidance System:** The interface shall include a comprehensive AI Assistant Commands guide featuring:
    * Available command syntax and examples
    * Clear explanations of automatic song repositioning behavior
    * Album-specific notes (e.g., கந்தர் அனுபூதி containing only one comprehensive song)
    * Visual warnings about 16-step sequence hierarchy adherence
* **FR-2.3: Secure API Calls:** User input from the chat interface shall be sent to the Node.js backend. The backend will then add the secure LLM API Key (from its environment variables) and proxy the request to the LLM service.
* **FR-2.4: Natural Language Understanding:** The LLM is responsible for interpreting user requests and converting them into structured JSON commands that the client-side JavaScript can execute to modify the playlist.
* **FR-2.5: Enhanced User Feedback:** The system shall provide clear, informative messages explaining the results of user commands, particularly when songs are repositioned according to the 16-step hierarchy.

**FR-5: Enhanced UI and Data Display**
* **FR-3.1: Streamlined Action Layout:** The system shall organize primary actions (Generate Playlist, Export PDF, Clear Playlist) in a single, consolidated location below the duration input for improved user workflow.
* **FR-3.2: Playlist Table Display:** The generated playlist shall be rendered in a Bootstrap-styled table and include the following columns (drag and delete controls may appear as leading columns in the UI): "Sl.No", "Song Title", "Song No", "Raagam", "Album", "Duration", "Cum. Time", "Hour" (shown as e.g., "1st Hr"), and "A" (Alankaaram). The "Alankaaram" header label shall display as "A" in the UI.
* **FR-5.3: Enhanced PDF Export:** The system shall provide comprehensive PDF generation capabilities with the following specifications:
    * **FR-5.3.1: Portrait Orientation:** PDF documents shall be generated in A4 portrait orientation with minimal margins (3mm) for maximum content utilization
    * **FR-5.3.2: Intelligent Filename Generation:** PDF files shall be automatically named using the format: `Occasion_DD-MM-YYYY_Day_HHMM[AM/PM]_HHMM[AM/PM].pdf`
        - **Occasion:** Function/occasion name with spaces and special characters replaced by underscores
        - **Date:** DD-MM-YYYY format (e.g., 30-10-2025) with leading zeros
        - **Day:** Day of week (e.g., Sunday, Monday) from bhajan details
        - **Time Range:** Start time and end time in 12-hour format with AM/PM designation (e.g., 0800AM, 1000AM)
        - **Example:** `குரு_பூர்ணிமா_30-10-2025_Thursday_0800AM_1000AM.pdf`
        - **Fallback:** If event details unavailable, defaults to `thirupugazh_playlist.pdf`
    * **FR-5.3.3: Font System:** PDF shall use Calibri 14pt as primary font with mixed sizing:
        - **Song Title:** 14pt for prominence and readability
        - **Raagam and Hour:** 11pt for compact display
        - **Other columns:** 14pt standard
    * **FR-5.3.4: High-Resolution Rendering:** PDF generation shall use html2canvas scale factor of 4 (up from 1.5) for sharp text rendering and fine border details
    * **FR-5.3.5: Professional Borders:** Table borders shall use 0.5pt solid lines in light gray (#ccc) for subtle, professional appearance with proper border-collapse support
    * **FR-5.3.6: Comprehensive Header Panel:** PDF shall include a centered header panel containing invocation (left/right), prarthanai text, function (bold), date|day|time, and host details
    * **FR-5.3.7: Column Set and Order:** PDF table shall contain exactly 6 columns in this order: Sl.No (5%), Song Title (45%), Raagam (18%), Song No (18%), Hour (8%), A (6%)
    * **FR-5.3.8: Alankaaram Mark:** The "A" column shall display a checkmark (✓) when enabled; leave empty when not
    * **FR-5.3.9: Repeating Headers:** Column headers shall repeat on every page with proper top borders
    * **FR-5.3.10: Optimized Pagination:** 
        - **First Page:** 38 songs (accounting for header panel space)
        - **Subsequent Pages:** 51 songs per page with 8px top margin
        - **Clean Breaks:** Each table starts fresh after explicit page break div
    * **FR-5.3.11: Compact Layout:** 
        - **Cell Padding:** 0px vertical, 1px horizontal for maximum density
        - **Line Height:** 1.0 for tight row spacing
        - **Header Spacing:** Minimal 2px margins between header elements
* **FR-3.5: Alankaaram Functionality:** The system shall provide comprehensive Alankaaram support with the following capabilities:
    * **FR-3.5.1: Checkbox Selection:** Each song row shall include a checkbox in the Alankaaram column allowing users to enable/disable Alankaaram for individual songs.
    * **FR-3.5.2: Time Duration Input:** When Alankaaram is enabled for a song, a time input field shall appear with a default value of 5 minutes, allowing users to specify duration between 1–30 minutes.
    * **FR-3.5.3: Visual Indicators:** The checkbox shall be accompanied by a musical note icon for clear visual identification.
    * **FR-3.5.4: Persistent Selection State:** Alankaaram selections and time durations shall be preserved across playlist modifications:
        - **Add Songs:** When new songs are added via AI assistant or manual commands, existing Alankaaram selections remain intact
        - **Remove Songs:** When a song is deleted from the playlist, its Alankaaram data is automatically removed
        - **Playlist Refresh:** Any playlist modification that retains existing songs shall preserve their Alankaaram state
        - **Clear Playlist:** Only the "Clear Playlist" action shall reset all Alankaaram data
        - **Storage:** Alankaaram data is stored by unique song ID, ensuring selections persist even if songs are reordered
* **FR-3.6: Alankaaram PDF Display:** The PDF export shall include the Alankaaram column with the following specifications:
    * **FR-3.6.1: Tickmark Display:** Songs with Alankaaram enabled shall show a checkmark (✓) symbol in the Alankaaram column.
    * **FR-3.6.2: Clean Display:** The checkmark displays without time duration for professional, clean appearance.
    * **FR-3.6.3: Empty State:** Songs without Alankaaram enabled shall show an empty Alankaaram column.
* **FR-3.7: Interactive Command Reference:** The interface shall display an integrated AI Assistant Commands guide with:
    * Collapsible or always-visible command syntax reference
    * Real-world usage examples that users can copy/paste
    * Contextual warnings and behavioral explanations

**FR-6: Playlist History and Repetition Avoidance**
* **FR-4.1: Persistent History:** The system shall use a MySQL database to store a history of generated songs. A table named `playlist_history` will be used with the following schema:
    * `id` INT AUTO_INCREMENT PRIMARY KEY
    * `song_id` INT NOT NULL
    * `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
* **FR-4.2: Repetition Avoidance Logic:** When generating a playlist, the Node.js backend must first query the `playlist_history` table to fetch a list of recently used `song_id`s.
    * The engine must attempt to select songs whose IDs are **not** in this recent list.
    * If no alternative exists for a compulsory category, the engine may use a recent song to fulfill the structural requirement.
* **FR-4.3: Saving History:** Upon successful generation of a playlist, the backend must `INSERT` the `song_id` for each song in the new playlist into the `playlist_history` table.
* **FR-4.4: Database Auto-Initialization:** The system shall automatically create the required database tables if they do not exist upon server startup, ensuring seamless deployment.

**FR-7: Song Search and Discovery**
* **FR-5.1: Fuzzy Search API:** The system shall provide a `/api/search-songs` endpoint that supports fuzzy string matching for song titles and album names.
* **FR-5.2: Search Parameters:** The search API shall accept the following parameters:
    * `query` (required): Search term for fuzzy matching
    * `albumFilter` (optional): Limit search to specific album
    * `minScore` (optional): Minimum match score threshold (default: 30)
    * `maxResults` (optional): Maximum number of results (default: 10)
* **FR-5.3: Search Results:** Search results shall include match scores and match type (title vs album) to help users identify the best matches.
* **FR-5.4: Album Songs API:** The system shall provide a `/api/songs/:album` endpoint to retrieve all songs from a specific album.

**FR-6: User Interface Enhancements**
* **FR-6.1: Keyboard Shortcuts:** The system shall support keyboard shortcuts for common operations:
    * `Ctrl + Enter`: Generate playlist
    * `Ctrl + P`: Export PDF
    * `Ctrl + Shift + C`: Clear playlist
    * `Enter`: Send chat message (when chat input is focused)
* **FR-6.2: Loading States:** The system shall provide visual feedback during long-running operations:
    * Playlist generation shall show a modal loading dialog
    * Buttons shall display spinner animations during processing
    * Safety timeout of 45 seconds shall prevent indefinite loading states
* **FR-6.3: Toast Notifications:** The system shall provide user feedback through toast notifications for:
    * Successful operations (success notifications)
    * Errors and warnings (error/warning notifications)
    * Informational messages (info notifications)
* **FR-6.4: Button State Management:** Action buttons (Export PDF, Clear Playlist) shall be disabled when no playlist is generated and enabled only when a playlist exists.

**FR-7: Multiple LLM Provider Support**
* **FR-7.1: Provider Configuration:** The system shall support multiple LLM providers through environment configuration:
    * Google Gemini API (default)
    * OpenAI API (fallback)
* **FR-7.2: Provider Selection:** The system shall automatically select the LLM provider based on the `LLM_PROVIDER` environment variable, defaulting to Gemini if not specified.
* **FR-7.3: API Format Handling:** The system shall handle different API request/response formats for each provider while maintaining consistent client-side interface.

**FR-8: Extended Compulsory Album Support**
* **FR-8.1: Post-வகுப்பு Compulsory Albums:** The system shall include three additional compulsory albums after வகுப்பு in the following order: பூஜோபசாரங்கள், ஏறுமயில், and ப்ரார்த்தனை.
* **FR-8.2: Album Assignment Validation:** The system shall ensure all songs in the extended sequence have proper album assignments in the songs database.
* **FR-8.3: Enhanced Album Name Mapping:** The system shall support English-to-Tamil mappings for the new compulsory albums (poojopacharangal, erumayil, prarthana) in both frontend and backend components.
* **FR-8.4: Corrected General Songs Positioning:** The system shall position General Songs at Step 6 of the sequence, immediately after the Five Abodes and before Pancha Bhoota Sthalams, correcting the previous misplacement at the end of the sequence.

**FR-9: Enhanced Playlist Header Display**
* **FR-9.1: Clean Header Format:** The system shall display playlist headers without text labels or colons for a clean, professional appearance.
* **FR-9.2: Center Alignment:** All header content shall be horizontally center-aligned for visual balance and professional presentation.
* **FR-9.3: Four-Line Structure:** The system shall organize header information in a structured 4-line format:
    * Line 1: Prayer text displayed in italic formatting
    * Line 2: Function name displayed in bold formatting
    * Line 3: Date, day, and time range separated by pipe (|) characters
    * Line 4: Host details including name, address, and contact information
* **FR-9.4: Conditional Display:** The system shall only display header lines when corresponding data is available and hide empty sections gracefully.

**FR-10: Improved Duration Accuracy**
* **FR-10.1: 5% Variance Tolerance:** The playlist generation algorithm shall maintain playlist duration within 5% of the user-requested target duration.
* **FR-10.2: Database-Driven Calculation:** The system shall use actual song durations from the database rather than estimates for precise time calculations.
* **FR-10.3: Real-Time Feedback:** The system shall provide clear logging and feedback about duration accuracy, including:
    * Target duration with tolerance range
    * Actual generated duration
    * Whether the playlist falls within acceptable variance
    * Suggestions for adjustment when outside tolerance
* **FR-10.4: Intelligent Album Sampling:** The system shall calculate remaining step durations by sampling actual songs from each mandatory album.

**FR-11: Professional PDF Generation**
* **FR-11.1: Enhanced Header Formatting:** PDF headers shall match playlist section formatting with center alignment and no text labels.
* **FR-11.2: Multi-Page Header Repetition:** When content spans multiple pages, headers shall automatically repeat on every page with identical formatting.
* **FR-11.3: Improved Table Borders:** PDF tables shall have properly closed borders preventing content spillage between pages with:
    * 2px solid borders on table edges
    * 1px borders between cells
    * Proper border closure at page ends
* **FR-11.4: Content Cleanup:** PDF generation shall exclude unnecessary elements:
    * Generated timestamps and date information
    * Footer text with version information
    * Redundant title repetitions
* **FR-11.5: Enhanced Typography:** PDF documents shall use 16pt bold fonts throughout for improved readability and professional appearance.

**FR-12: System Health and Monitoring**
* **FR-12.1: Health Check Endpoint:** The system shall provide a `/api/health` endpoint for monitoring system status and database connectivity.
* **FR-12.2: Error Logging:** The system shall log detailed error information including stack traces, request details, and timestamp for debugging purposes.
* **FR-12.3: Request Timeout Handling:** API requests shall have appropriate timeout handling to prevent hanging connections.

#### 3.2 Non-Functional Requirements

**Performance Requirements**
* **NFR-1: Response Time:** Playlist generation and UI rendering should complete within 10 seconds.
* **NFR-2: Timeout Management:** All API requests must have configurable timeouts (45 seconds for playlist generation, 30 seconds for LLM requests).
* **NFR-3: Database Performance:** Database queries should be optimized with appropriate indexes on `song_id` and `created_at` columns in the `playlist_history` table.
* **NFR-3.1: Duration Accuracy:** Playlist generation must achieve target duration within 5% variance using database-driven calculations and intelligent album sampling for precise time estimation.
* **NFR-4: PDF Professional Quality:** PDF generation must maintain professional standards with:
    * 16pt bold fonts throughout for enhanced readability
    * Portrait orientation with 0.5-inch margins for optimal layout
    * Clean, center-aligned headers without unnecessary labels
    * Proper table border closure preventing content spillage
    * Header repetition on all pages for multi-page documents
    * Removal of extraneous timestamps and footer content for clean presentation

**Usability Requirements**
* **NFR-5: Enhanced Usability:** The application must provide an intuitive and user-friendly experience including:
    * Clear, actionable guidance for AI chatbot commands
    * Multi-line input support for complex user requests
    * Comprehensive command examples and syntax reference
    * Transparent explanations of system behavior (e.g., song repositioning)
    * Streamlined action button layout for improved workflow
* **NFR-6: User Education:** The system shall proactively educate users about:
    * Available chatbot commands and their syntax
    * Expected behavior of song manipulation operations
    * Special album characteristics (e.g., single comprehensive songs)
    * 16-step sequence hierarchy and its impact on song positioning
* **NFR-7: Accessibility:** The interface must support keyboard navigation and provide appropriate ARIA labels for screen readers.
* **NFR-8: Mobile Responsiveness:** The application must be fully functional on mobile devices with responsive design that stacks columns vertically on smaller screens.

**Reliability Requirements**
* **NFR-9: Error Recovery:** The application must handle cases where a song for a compulsory category cannot be found by logging a warning and proceeding with the next step.
* **NFR-10: Graceful Degradation:** The system shall continue functioning with basic playlist generation even if AI chatbot functionality is unavailable due to missing API keys.
* **NFR-11: Database Connectivity:** The system shall handle database connection failures gracefully and display appropriate error messages to users.
* **NFR-12: Button State Integrity:** PDF Export and Clear Playlist buttons must maintain proper enabled/disabled states to prevent user errors.

**Security Requirements**
* **NFR-13: API Key Security:** All communication with external services containing sensitive keys must be handled exclusively by the backend, never by the client.
* **NFR-14: Input Validation:** All user inputs must be validated and sanitized to prevent injection attacks:
    * Duration input must be validated as integer between 10-300
    * Chat messages must be sanitized before sending to LLM
    * Search queries must be properly escaped
* **NFR-15: Environment Configuration:** Sensitive information must be stored in environment variables and never committed to version control.
* **NFR-16: Database Security:** Database credentials must be securely configured and connections must use proper authentication.

**Maintainability Requirements**
* **NFR-17: Code Organization:** The code must adhere to the Separation of Concerns (DEV-C3) and secure Configuration Management (DEV-C4) to facilitate easier updates and debugging.
* **NFR-18: Modular Architecture:** Client-side code must be organized in classes with single responsibility (ApiService, ChatManager, PlaylistManager, etc.).
* **NFR-19: Error Handling:** Comprehensive error handling must be implemented at all levels (network errors, database errors, validation errors).
* **NFR-20: Logging:** Detailed logging must be implemented for debugging and monitoring purposes with appropriate log levels.

**Availability Requirements**
* **NFR-21: Database Initialization:** The system must automatically initialize required database structures on first run.
* **NFR-22: Startup Validation:** The system must validate critical dependencies (database connectivity, environment variables) on startup and fail gracefully with clear error messages.
* **NFR-23: Deployment Readiness:** The application must be deployable with minimal configuration requirements and include comprehensive setup documentation.

---
### 4. Future Enhancement Requirements (Not Yet Implemented)

The following requirements represent identified gaps and potential future enhancements to the system:

#### 4.1 Missing Core Functionality

**FR-F1: Advanced Playlist Management**
* **FR-F1.1: Playlist Save/Load:** Users should be able to save generated playlists with custom names and reload them later.
* **FR-F1.2: Playlist Templates:** System should support creating and managing reusable playlist templates for different occasion types.
* **FR-F1.3: Bulk Operations:** Support for bulk song operations (select multiple songs, bulk remove, bulk replace).
* **FR-F1.4: Playlist Comparison:** Ability to compare two playlists and highlight differences.

**FR-F2: Export Format Options**
* **FR-F2.1: Multiple Export Formats:** Support for exporting playlists in additional formats (Excel, CSV, Word, plain text).
* **FR-F2.2: Custom PDF Templates:** Configurable PDF templates with different layouts and branding options.
* **FR-F2.3: Print Optimization:** Specialized print-friendly layouts with optimized spacing and fonts.

**FR-F3: Advanced Search and Filtering**
* **FR-F3.1: Advanced Filters:** Support for filtering songs by raga, duration range, song number, or custom criteria.
* **FR-F3.2: Song Preview:** Audio preview functionality for songs (if audio files are available).
* **FR-F3.3: Song Metadata Enhancement:** Additional song information like composer, meaning, difficulty level.

**FR-F4: User Preferences and Customization**
* **FR-F4.1: User Profiles:** Individual user accounts with personal preferences and saved playlists.
* **FR-F4.2: Customizable Sequence:** Allow advanced users to modify the 16-step sequence order or create custom sequences.
* **FR-F4.3: Theme Support:** Dark mode and custom theme options for the user interface.

#### 4.2 Missing Technical Features

**NFR-F1: Enhanced Security**
* **NFR-F1.1: Rate Limiting:** API rate limiting to prevent abuse and ensure fair usage.
* **NFR-F1.2: HTTPS Enforcement:** Mandatory HTTPS in production with proper SSL certificate configuration.
* **NFR-F1.3: Content Security Policy:** Implementation of CSP headers to prevent XSS attacks.
* **NFR-F1.4: Session Management:** Secure session handling if user accounts are implemented.

**NFR-F2: Performance and Scalability**
* **NFR-F2.1: Caching Strategy:** Implement caching for frequent database queries and API responses.
* **NFR-F2.2: Database Connection Pooling:** Proper connection pooling for better database performance.
* **NFR-F2.3: CDN Support:** Content delivery network support for static assets.
* **NFR-F2.4: Load Testing:** Comprehensive load testing to ensure performance under concurrent users.

**NFR-F3: Monitoring and Analytics**
* **NFR-F3.1: Application Monitoring:** Real-time monitoring of application health, response times, and error rates.
* **NFR-F3.2: Usage Analytics:** Track playlist generation patterns, popular songs, and user engagement metrics.
* **NFR-F3.3: Error Tracking:** Comprehensive error tracking and alerting system.
* **NFR-F3.4: Performance Metrics:** Detailed performance metrics collection and dashboards.

**NFR-F4: Deployment and DevOps**
* **NFR-F4.1: Docker Support:** Complete Docker containerization with multi-stage builds.
* **NFR-F4.2: CI/CD Pipeline:** Automated testing and deployment pipeline.
* **NFR-F4.3: Environment Management:** Proper staging, testing, and production environment configurations.
* **NFR-F4.4: Backup and Recovery:** Automated database backup and disaster recovery procedures.

**NFR-F5: Advanced Error Handling**
* **NFR-F5.1: Retry Logic:** Intelligent retry mechanisms for transient failures.
* **NFR-F5.2: Circuit Breaker Pattern:** Implementation of circuit breaker pattern for external API calls.
* **NFR-F5.3: Graceful Shutdown:** Proper application shutdown handling to complete ongoing requests.

#### 4.3 Mobile and Progressive Web App Features

**NFR-F6: Mobile Optimization**
* **NFR-F6.1: Progressive Web App:** PWA support with offline capabilities and app-like experience.
* **NFR-F6.2: Mobile-Specific UI:** Touch-optimized controls and mobile-first design improvements.
* **NFR-F6.3: Offline Mode:** Basic playlist viewing and PDF export in offline mode.
* **NFR-F6.4: App Store Distribution:** Packaging as mobile apps for iOS and Android app stores.

#### 4.4 Integration and API Enhancement

**NFR-F7: External Integrations**
* **NFR-F7.1: Music Platform Integration:** Integration with music streaming platforms for audio playback.
* **NFR-F7.2: Calendar Integration:** Integration with calendar systems for automatic playlist scheduling.
* **NFR-F7.3: Email Integration:** Automatic email distribution of generated playlists.
* **NFR-F7.4: Social Sharing:** Share playlists on social media platforms.

---
### 5. Implementation Status and Future Roadmap

#### 5.1 Version 3.0 Completion Summary
**Completed Major Features:**
* ✅ **Glassmorphism UI Design System** - Complete visual redesign with animated gradients and frosted glass effects
* ✅ **Comprehensive Event Management** - Prayer selection, function scheduling, and member coordination systems
* ✅ **Enhanced Playlist Generation** - Added குன்றுதோறாடல் album step and comprehensive header integration
* ✅ **Advanced PDF Generation** - Portrait orientation with headers, 12pt fonts, and professional formatting
* ✅ **Member Database Integration** - Complete contact management with 22 bhajan group members
* ✅ **Enhanced User Experience** - Interactive selectors, auto-population, and visual feedback systems

#### 5.2 Future Implementation Priority

**High Priority (Next Version 3.3):**
1. Rate limiting implementation (NFR-F1.1)
2. Enhanced input validation and sanitization (NFR-14)
3. Improved error tracking and logging (NFR-F3.1)
4. Database connection pooling (NFR-F2.2)
5. Progressive Web App capabilities (NFR-F6.1)

**Medium Priority (Version 3.3):**
1. Music platform integration for audio playback (NFR-F7.1)
2. Calendar integration for automatic scheduling (NFR-F7.2)
3. Email distribution system (NFR-F7.3)
4. Mobile app packaging (NFR-F6.4)

---
### 6. Version History Summary

**Version 3.1 (January 31, 2025)** - Six Main Abodes & PDF Enhancement Release
- Enhanced playlist generation: 6 main abodes now provide 2 songs each (total 12 songs)
- Simplified PDF alankaaram display: tick mark only without time duration
- Improved playlist duration accuracy with 5% tolerance algorithm
- Enhanced event management with Start Time/End Time fields
- Refined glassmorphism UI design with white/gray/silver color scheme

**Version 3.0 (January 30, 2025)** - Major Event Management Release
- Complete glassmorphism UI redesign
- Prayer, function, and member management systems
- Enhanced PDF generation with comprehensive headers
- Extended playlist generation with குன்றுதோறாடல் album

**Version 2.8 (January 29, 2025)** - Alankaaram Enhancement Release
- Comprehensive Alankaaram functionality with time customization
- Enhanced PDF formatting and readability improvements
- Table structure updates with 6-column layout

**Previous Versions (2.1-2.7)** - Foundation and Core Features
- 16-step playlist generation algorithm
- AI chatbot integration with LLM support
- PDF export capabilities and responsive design
- Database integration and history management

---

**Document Status:** Version 3.0 Complete - All major event management features implemented and tested. The application now provides comprehensive bhajan event coordination capabilities with modern glassmorphism UI design and professional PDF generation with complete event documentation.