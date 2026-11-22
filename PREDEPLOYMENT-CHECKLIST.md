# Ocean of Wisdom — pre-deployment audit and handoff

Working branch: `bharata-bhasha-atlas-nov-2026`  
Base branch: `main`  
Latest functional change reviewed: multilingual Knowledge Library rights notice and audit check through `568c5333e7ccaece6ce0b00644b48876c9ef2308`
Status: **Not deployed. Browser/device QA and the remaining blockers below must be completed before production release.**

## Repository scope

- The current Atlas draft branch is 364 commits ahead of `main` and 0 commits behind at the latest comparison.
- The latest branch comparison reports 69 changed files. The Atlas adds 56 four-language routes to the existing website work.
- The earlier tracked-file count from the pending-work branch is stale and is not repeated here. All changes remain isolated on this working branch. No merge or production deployment was performed.

## Work implemented

- Created `indian-classic-wisdom-literature.html`, a dedicated Indian literary collection, and added it to the homepage, Explore navigation, World Literature cross-link and sitemap.
- Refocused `ancient-indian-wisdom.html` on applied knowledge and technical traditions to avoid duplicating the new literature collection. Added a detailed, high-contrast Chanakya/Kautilya Arthaśāstra section and linked it from the new literature page.
- Added `vedic-rishis.html` and repaired seven pages that previously pointed to a missing Vedic sages destination.
- Added contextual “Explore related topics in depth” links to 37 core content pages.
- Added a detailed-topic destination mapping for all 50 Knowledge Library records.
- Added the record-level source title/type panel to the Knowledge Library and refined source destinations. Fourteen record references were corrected or improved during the source review.
- Removed the global `!important` dark-background override from `ocean-global.css`. Page-specific foreground/background pairs can now take precedence; the Indian Classic Wisdom and Ancient Indian Knowledge pages explicitly use high-contrast light text on dark panels. The Chanakya/Kautilya Arthaśāstra discussion now lives in a dedicated, readable statecraft section.
- Added accessible, explicitly labelled Google Translate reading links to selected English research pages that do not have authored translation siblings. These are machine translations, not editorially reviewed translations.

## Translation audit

- Checked 15 translated page families (60 English/Hindi/Tamil/Spanish pages). Each family has four language destinations; translated pages have the correct `lang` attribute and a route back to English.
- Corrected missing/inconsistent language navigation on the Indian Philosophies, World Philosophies and Ancient Solutions families.
- Checked the five core question pages: What Is All This?, Am I Connected?, I Am That, What Is Truth? and What Is Bliss? Each has four language controls, language data for EN/HI/TA/ES and click-handler logic.
- Executed the actual fallback scripts for all five pages in a DOM harness. Hindi, Tamil and Spanish switching passed on every page; all 25–28 `data-i18n` keys per page had entries in all four language dictionaries, and each switch updated the document language and visible text.
- Checked language data and controls on Who Am I?, Sanatana Dharma, both interactive tool laboratories and Wisdom of India.
- The homepage has EN/HI/TA/ES controls; Hindi and Spanish use Google Translate, Tamil has a separate page.
- The Knowledge Library has its own four-language UI and translated record metadata.
- The eight detailed Knowledge Library essays use a clearly labelled machine-translation fallback; additional English-only pages also use this fallback where no authored translated sibling page exists. These machine translations are not editorially reviewed.

### Calendar localisation and astronomy QA

- Added a visible four-option language selector (English, Hindi, Tamil and Malayalam) to the Surya Siddhanta calendar.
- Localised the main interface, historical/range notes, date controls, location labels, date help, section headings, engine status, weekday/month labels, BCE/CE labels, Moon phase names, Panchang field labels, tithi names, Rahu Kaal/Gulikai/Yamagandam labels and Panchang explanatory note.
- Verified all four language dictionaries contain the same 56 keys; exercised the selector in a lightweight DOM harness and confirmed it changes the document language, updates visible labels and calls the calendar render function.
- Repaired a control-flow defect in the planetary panel: when Swiss Ephemeris was available, the previous function returned immediately after showing sidereal positions, preventing the local-visibility calculation from running. The panel now keeps DE431 sidereal positions and separately calculates local naked-eye visibility for 1800–2200 CE; outside that interval it explicitly withholds local-visibility claims.
- Parsed all three inline calendar scripts after the changes. This is a static syntax check and a selector harness check, not a real-browser calculation test.
- Re-ran the calendar checks after the localisation changes: all three inline scripts parse; all four dictionaries contain the same 57 keys; every localisation target ID exists; a simulated Malayalam selection updated the page language and labels and invoked the render callback.
- Remaining calendar localisation work: detailed planetary visibility result strings and eclipse-result messages still contain English text; country names and some technical labels also remain English. Full language parity is not yet achieved.
- Remaining calendar feature gaps: a distinct lunar/Nakshatra-month (māsa) label is not yet displayed. Eclipse output gives the global event and selected-location visibility, but does not yet map the worldwide visibility path or identify all regions affected. The currently available browser eclipse engine remains limited to 1800–2200 CE.

## Automated audit infrastructure

- Added `scripts/site-audit.mjs` to enforce the 56 Atlas route checks, document structure and responsive CSS references, sitemap coverage, inline-script syntax, calendar selector/translation-target integrity, four-language tool dictionaries, external tool URLs and 50-record Knowledge Library integrity.
- Added `.github/workflows/site-audit.yml` to run the audit on the development branch, pull requests and `main`.
- The script and workflow are committed to the draft branch. No GitHub Actions run result is currently available in the audit evidence; manual harness and static checks are recorded above.

## Internal link audit

- Crawled the 103 HTML pages present before the new Vedic sages page was added, examining local `href` and `src` references (approximately 1,022 local references).
- Found references to a missing Vedic sages page; created the page and corrected the seven callers.
- Rechecked the seven callers, the new Vedic sages page, the Knowledge Library index and the sitemap. No missing local destinations remained in that affected set.
- Checked 24 key cross-link destinations against the branch tree; all existed.
- The new Indian literature page has one HOME control, valid local links and nine content sections.

## Knowledge Library source review

- Confirmed 50 records, each with a specific source URL, descriptive source title and source type.
- Added an English, Hindi, Tamil and Spanish access-and-rights notice explaining that free-to-read access does not automatically grant reuse rights, that provider registration/download limits may apply, and that source texts and images remain with their rights holders. The automated audit checks the notice in all four languages.
- Opened/reviewed the 50 destinations using source-page content where available; corrected wrong-topic, stale, generic or unsuitable links.
- Examples of corrected destinations include the Indus/Harappa open-access Cambridge article (CC BY), the Ministry of Jal Shakti stepwell explainer, the Tikal UNESCO dossier, the Rani-ki-Vav UNESCO dossier, the MIT Internet Classics Analects text, Project Gutenberg's Tao Teh King, the complete Ganguli Mahabharata reading edition, the Chinese Ming astronomical records paper, and the Ptolemy Almagest scholarly record.
- The Indus article explicitly states that it is open access under CC BY 4.0; the UNESCO pages state CC BY-SA IGO 3.0; the Maya astronomy article is labelled CC BY-NC 4.0.
- A freely readable page is not automatically openly licensed or public domain. Ocean of Wisdom links to these sources and does not republish their protected text, images or PDFs. Rights status should be described per source, not generalised.

### External-link caveats for manual browser check

- SuttaCentral is a JavaScript application; the automated text reader cannot render it, although the site states that it supports current Chrome, Firefox, Edge, Opera and Safari.
- The Maya astronomy PMC page may present anti-bot checks to automated readers; test the link in a normal browser.
- The Internet Archive Surya Siddhanta item uses a JavaScript book reader but provides downloadable full-text/PDF options.
- The source review is focused on the 50 Knowledge Library records. It is not a legal clearance of every external URL elsewhere on the site.

## Static checks performed

- The 15 translated families were checked for four navigation links and English return links.
- The 56 Bharata Bhasha Atlas routes were individually checked: four language-switcher links per route, all four destinations resolve to existing Atlas files, exactly one active language state, and exactly one HOME link per route. The 56-route audit includes the portal, eleven language families, comparative connections and translator pages.
- All 56 routes also passed the structural check: one HTML5 doctype, one opening/closing html, head and body element, and a responsive viewport meta tag. Each route links the shared language-button stylesheet and Atlas stylesheet; the shared Atlas CSS includes a 600px mobile breakpoint.
- Expanded the Indian tools page with three institution-maintained Indian research resources (NDLI, GRETIL and Cologne Digital Sanskrit Dictionaries) and four international astronomy/science tools (NASA Eyes, NASA/JPL Horizons, Stellarium Web and ViewSpace). The homepage card now describes the combined Indian and global research-tools section.
- Verified the seven external destinations against their official institutional or project pages. The page has four complete language dictionaries (68 keys each), no duplicate IDs, and its inline script parses. A simulated Spanish language switch updated the new tool headings and links.
- Corrected the NDLI search destination to its current Search & Discovery endpoint and corrected the Cologne dictionary count to 43, matching the university directory. The repeatable site-audit script now checks all seven external tool URLs and the expected 11 total tool cards.
- Exercised the four Indian calculators in a lightweight DOM harness: Kuttaka example 26x ≡ 1 (mod 7) returns x = 3 with verification; 3–4 right-triangle input returns diagonal 5, area 6 and perimeter 12; the rainwater example returns 8,000 L potential harvest, 5,000 L stored, 3,000 L overflow and 25 days of demand; invalid runoff coefficients are rejected.
- Exercised the four world-history calculators: 3661.5 converts to base-60 1;1;1,30; 15 October 1582 Julian converts to 25 October 1582 Gregorian; Maya Long Count 13.0.0.0.0 with GMT 584283 converts to 21 December 2012; the sample lever calculation balances 25 N.
- The five core question pages were checked for four language keys and click-handler code.
- Ten representative changed pages were checked for a single DOCTYPE, one opening/closing html/head/body pair and no duplicate HTML IDs.
- The new Indian literature and Vedic sages pages were checked for one HOME control, page structure and local references.
- No real browser runtime, mobile device, JavaScript console, assistive-technology or production-domain test was available in this repository audit. Static checks do not prove that every click interaction or responsive layout works.

## Required before deployment

1. Finish localisation of remaining dynamic planet-visibility and eclipse outputs; implement and validate the requested māsa display and worldwide eclipse-region information; verify all four language modes in real browsers.
2. Open the working branch in real desktop and Android/iOS browsers. Test all native language buttons and all Google Translate fallbacks.
3. Run all interactive calculators with normal, boundary and invalid inputs; independently verify numerical outputs.
4. Validate the calendar against agreed independent ephemeris/Panchang cases and its supported date/location limits.
5. Inspect the Arthashastra/Chanakya content, all related-topic panels, HOME controls, typography, contrast and responsive layouts at phone and desktop widths.
6. Check browser console/network errors, search, navigation, images, accessibility and keyboard operation.
7. Recheck the final diff against `main`, confirm GitHub Pages build status, and only then deploy with approval.

## Deployment decision

**Do not deploy from this audit alone.** The branch contains the requested content and link/navigation repairs, but the calendar localisation gap and real-browser/device testing remain open. No claim of full functional QA, complete human translation, independent astronomical validation or production deployment is made.
