document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const navList = document.getElementById('nav-list');
    const ministrySearch = document.getElementById('ministry-search');
    const dataSearch = document.getElementById('data-search');
    const tableContainer = document.getElementById('table-container');
    const emptyState = document.getElementById('empty-state');
    const noResults = document.getElementById('no-results');
    const activeMinistryTitle = document.getElementById('active-ministry-title');
    const tableHeaderRow = document.getElementById('table-header-row');
    const tableBody = document.getElementById('table-body');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const schoolFilter = document.getElementById('school-filter');

    // Tab Elements
    const tabControls = document.getElementById('tab-controls');
    const tabInstitutes = document.getElementById('tab-institutes');
    const tabOpportunities = document.getElementById('tab-opportunities');
    const tabIndicator = document.querySelector('.tab-indicator');

    // State array holding JSONs
    let allData = { institutes: {}, opportunities: {} };
    let ministriesKeys = [];
    let currentMinistryKey = null;
    let currentParsedData = [];
    let currentViewToken = 'institutes'; // 'institutes' or 'opportunities'
    let currentSchoolFilter = 'ALL';

    // LPU Schools exact list
    const lpuSchools = [
        "School of Agriculture",
        "School of Bio Engineering and Bio Sciences",
        "School of Chemical Engineering and Physical Sciences",
        "School of Civil Engineering",
        "School of Computer Applications",
        "School of Computer Science and Engineering",
        "School of Computing and Artificial Intelligence",
        "School of AI and Emerging Technologies",
        "School of Electronics and Electrical Engineering",
        "School of Mechanical Engineering",
        "School of Polytechnic",
        "Lovely School of Architecture and Design",
        "Mittal School of Business",
        "School of Design (Interior and Product Design)",
        "School of Design (Fashion Design and Technology)",
        "School of Design (Multimedia)",
        "School of Education (Physical Education)",
        "School of Education",
        "School of Hotel Management and Tourism",
        "School of Law",
        "School of Liberal and Creative Arts (Film Theatre and Music)",
        "School of Liberal and Creative Arts (Fine Arts)",
        "School of Liberal and Creative Arts (Journalism and Mass Communication)",
        "School of Liberal and Creative Arts (Social Sciences and Languages)",
        "School of Allied Medical Sciences",
        "School of Pharmaceutical Sciences"
    ];

    // Helper: Match text to LPU Schools based on keywords from multiple columns
    function extractSchools(eligibilityText, descriptionText) {
        if (!eligibilityText && !descriptionText) return [];
        const lowerElig = eligibilityText ? eligibilityText.toString().toLowerCase() : "";
        const lowerDesc = descriptionText ? descriptionText.toString().toLowerCase() : "";
        let matched = new Set();

        const checkText = (kw) => {
            // Use word boundary regex: matches keyword as a whole word, 
            // handling punctuation, spaces, start/end of string.
            // Also escapes special characters in keyword just in case
            const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
            return regex.test(lowerElig) || regex.test(lowerDesc);
        };

        // Exact matching
        lpuSchools.forEach(school => {
            const lowerSchool = school.toLowerCase();
            if (lowerElig.includes(lowerSchool) || lowerDesc.includes(lowerSchool)) {
                matched.add(school);
            }
        });

        // Keyword mapping
        if (checkText('bams') || checkText('bhms') || checkText('ayurved') || checkText('pharma') || checkText('medical') || checkText('health') || checkText('siddha') || checkText('drug') || checkText('clinical')) {
            matched.add("School of Pharmaceutical Sciences");
            matched.add("School of Allied Medical Sciences");
        }
        if (checkText('agriculture') || checkText('horticulture') || checkText('agronomy') || checkText('farming') || checkText('crop') || checkText('soil')) {
            matched.add("School of Agriculture");
        }
        if (checkText('biotech') || checkText('bioscience') || checkText('life science') || checkText('biology') || checkText('botany') || checkText('zoology')) {
            matched.add("School of Bio Engineering and Bio Sciences");
        }
        if (checkText('management') || checkText('mba') || checkText('business') || checkText('commerce') || checkText('finance') || checkText('startup') || checkText('entrepreneur')) {
            matched.add("Mittal School of Business");
        }
        if (checkText('law') || checkText('legal') || checkText('justice') || checkText('court')) {
            matched.add("School of Law");
        }
        if (checkText('computer') || checkText('it ') || checkText('software') || checkText('ai') || checkText('data') || checkText('cyber') || checkText('coding') || checkText('programming')) {
            matched.add("School of Computer Science and Engineering");
            matched.add("School of Computing and Artificial Intelligence");
            matched.add("School of Computer Applications");
        }
        if (checkText('aeronautical') || checkText('aerospace') || checkText('aviation')) {
            matched.add("School of Mechanical Engineering");
        }
        if (checkText('engineering') || checkText('b.tech') || checkText('hardware') || checkText('electronics') || checkText('mechanical') || checkText('civil') || checkText('chemical')) {
            matched.add("School of Electronics and Electrical Engineering");
            matched.add("School of Mechanical Engineering");
            matched.add("School of Civil Engineering");
            matched.add("School of Chemical Engineering and Physical Sciences");
        }
        if (checkText('art') || checkText('music') || checkText('film') || checkText('theatre') || checkText('media') || checkText('journalism') || checkText('language')) {
            matched.add("School of Liberal and Creative Arts (Film Theatre and Music)");
            matched.add("School of Liberal and Creative Arts (Journalism and Mass Communication)");
        }
        if (checkText('education') || checkText('teaching') || checkText('pedagogy')) {
            matched.add("School of Education");
        }

        return Array.from(matched);
    }

    // Initialize Dropdown
    function initSchoolDropdown() {
        lpuSchools.forEach(school => {
            const opt = document.createElement('option');
            opt.value = school;
            opt.textContent = school;
            schoolFilter.appendChild(opt);
        });

        schoolFilter.addEventListener('change', (e) => {
            currentSchoolFilter = e.target.value;
            applyGlobalSchoolFilter();
        });
    }

    // Fetch Both JSON Data Sources concurrently
    Promise.all([
        fetch('data.json').then(r => r.json()),
        fetch('collaboration.json').then(r => r.json())
    ])
        .then(([institutesData, collabData]) => {
            allData.institutes = institutesData;
            allData.opportunities = collabData;

            // Use institutes data keys as the primary list of ministries
            ministriesKeys = Object.keys(institutesData);
            initSchoolDropdown();
            initializeSidebar();
        })
        .catch(err => {
            console.error(err);
            navList.innerHTML = `<div class="loading-text" style="color:#ef4444;">Error loading data: ${err.message}</div>`;
        });

    // Mobile Menu Toggle
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Initialize sidebar with data
    function initializeSidebar() {
        renderSidebar(ministriesKeys);
    }

    function renderSidebar(keys) {
        navList.innerHTML = '';
        if (keys.length === 0) {
            navList.innerHTML = '<div class="loading-text">No matching ministries</div>';
            return;
        }

        keys.forEach(key => {
            const item = document.createElement('div');
            item.className = 'nav-item';
            const cleanName = key.replace(/^[0-9]+[.]\s*/, '').trim();
            item.textContent = cleanName;

            if (key === currentMinistryKey) {
                item.classList.add('active');
            }

            item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');

                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('open');
                }

                loadMinistryData(key, cleanName);
            });
            navList.appendChild(item);
        });
    }

    // Filter ministries
    ministrySearch.addEventListener('input', (e) => {
        applyGlobalSchoolFilter();
    });

    // Apply Global Filter (School + Search)
    function applyGlobalSchoolFilter() {
        const query = ministrySearch.value.toLowerCase();
        let filteredKeys = ministriesKeys.filter(k => k.toLowerCase().includes(query));

        if (currentSchoolFilter !== 'ALL') {
            filteredKeys = filteredKeys.filter(key => {
                // Check if any opportunity under this ministry matches the school
                const matchingCollabKey = Object.keys(allData.opportunities).find(k => k.includes(key) || key.includes(k));
                if (!matchingCollabKey) return false;

                const oppsData = allData.opportunities[matchingCollabKey];
                if (!oppsData || !Array.isArray(oppsData)) return false;

                // Check raw data rows for matching derived schools
                for (let i = 0; i < oppsData.length; i++) {
                    const rowVals = Object.values(oppsData[i]);
                    if (rowVals.length === 0) continue;
                    // LPU Eligibility is usually the last column, Description is index 4
                    const eligibilityText = rowVals[rowVals.length - 1];
                    const descriptionText = rowVals.length >= 5 ? rowVals[4] : "";

                    const extracted = extractSchools(eligibilityText, descriptionText);
                    if (extracted.includes(currentSchoolFilter)) {
                        return true;
                    }
                }
                return false;
            });
        }

        renderSidebar(filteredKeys);

        // Refresh active table if one is open
        if (currentMinistryKey) {
            refreshCurrentView();
        }
    }

    // Tab Switching Logic
    function updateTabIndicator(activeBtn) {
        tabIndicator.style.width = `${activeBtn.offsetWidth}px`;
        tabIndicator.style.transform = `translateX(${activeBtn.offsetLeft - 4}px)`; // -4 for padding
    }

    // Initialize indicator on resize
    window.addEventListener('resize', () => {
        if (!tabControls.classList.contains('hidden')) {
            const activeBtn = currentViewToken === 'institutes' ? tabInstitutes : tabOpportunities;
            updateTabIndicator(activeBtn);
        }
    });

    tabInstitutes.addEventListener('click', (e) => {
        if (currentViewToken === 'institutes') return;
        currentViewToken = 'institutes';
        tabOpportunities.classList.remove('active');
        tabInstitutes.classList.add('active');
        updateTabIndicator(tabInstitutes);
        refreshCurrentView();
    });

    tabOpportunities.addEventListener('click', (e) => {
        if (currentViewToken === 'opportunities') return;
        currentViewToken = 'opportunities';
        tabInstitutes.classList.remove('active');
        tabOpportunities.classList.add('active');
        updateTabIndicator(tabOpportunities);
        refreshCurrentView();
    });

    // Load data for selected ministry
    function loadMinistryData(key, cleanName) {
        currentMinistryKey = key;
        activeMinistryTitle.textContent = cleanName;
        dataSearch.value = ''; // Reset search

        // Show tabs, hide empty state
        tabControls.classList.remove('hidden');
        emptyState.classList.remove('visible');
        tableContainer.classList.remove('hidden');
        noResults.classList.add('hidden');

        // Set initial indicator pos
        setTimeout(() => {
            const activeBtn = currentViewToken === 'institutes' ? tabInstitutes : tabOpportunities;
            updateTabIndicator(activeBtn);
        }, 50);

        refreshCurrentView();
    }

    // Re-parse and render based on active tab
    function refreshCurrentView() {
        if (!currentMinistryKey) return;

        // Find matching key in opportunities JSON (names might slightly differ, so we do a partial match if needed)
        let oppsData = [];
        if (currentViewToken === 'opportunities') {
            const matchingCollabKey = Object.keys(allData.opportunities).find(k => k.includes(currentMinistryKey) || currentMinistryKey.includes(k));
            oppsData = matchingCollabKey ? allData.opportunities[matchingCollabKey] : [];
        }

        const rawData = currentViewToken === 'institutes' ? allData.institutes[currentMinistryKey] : oppsData;

        currentParsedData = parseSheetData(rawData);

        currentParsedData = parseSheetData(rawData);

        // Always pass through the filter pipeline so both text-search and 
        // LPU School dropdown selections dynamically crop the table view.
        handleTableFilter();
    }

    // Helper to check if a row is considered a header
    function isHeaderRow(row) {
        const vals = Object.values(row);
        const joined = vals.filter(v => typeof v === 'string').join('').toLowerCase();
        // Matching signatures from both Excels
        return joined.includes('sr. no') || joined.includes('s. no') || joined.includes('lab / institute') || joined.includes('disciplines offered');
    }

    // Helper to check if a row is a section title
    function isSectionTitleRow(row) {
        const vals = Object.values(row);
        let nonNullCount = 0;
        let firstColHasData = false;

        const keys = Object.keys(row);
        if (keys.length > 0 && row[keys[0]] !== null && row[keys[0]] !== '') {
            firstColHasData = true;
        }

        vals.forEach(v => {
            if (v !== null && v !== '') nonNullCount++;
        });

        return firstColHasData && nonNullCount === 1;
    }

    // Parse messy Excel JSON into a robust structure
    function parseSheetData(rawData) {
        if (!rawData || rawData.length === 0) return { headers: [], rows: [] };

        let headers = [];
        let parsedRows = [];

        let headerRowObj = rawData.find(isHeaderRow);

        if (headerRowObj) {
            headers = Object.values(headerRowObj).map(v => v ? v.toString().replace(/\n/g, ' ').trim() : '');

            // For collaboration, sometimes the first cell is completely blank but it's the sequence col
            if (headers[0] === '' || headers[0].includes('Ministry')) {
                headers[0] = 'S.No';
            }
        } else {
            headers = currentViewToken === 'institutes' ?
                ['Title/Name', 'Details', 'Location', 'Info', 'Head'] :
                ['S.No', 'Scheme', 'Body', 'Type', 'Purpose', 'Link', 'Docs', 'Eligibility'];
        }

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];

            if (isHeaderRow(row)) continue;

            const vals = Object.values(row);
            if (vals.every(v => v === null || v.toString().trim() === '')) continue;

            if (isSectionTitleRow(row)) {
                parsedRows.push({
                    type: 'section',
                    title: vals[0]
                });
                continue;
            }

            // Extract LPU Schools if we are in Opportunities view
            let lpuSchoolsArr = [];
            if (currentViewToken === 'opportunities' && vals.length > 0) {
                // Eligibility is usually the last column, Description is usually index 4
                const elText = vals[vals.length - 1];
                const descText = vals.length >= 5 ? vals[4] : "";
                lpuSchoolsArr = extractSchools(elText, descText);
            }

            parsedRows.push({
                type: 'data',
                cells: vals,
                lpuSchools: lpuSchoolsArr
            });
        }

        return { headers, rows: parsedRows };
    }

    // Data formatter (convert emails/links/schools)
    function formatCell(cellValue, isEligibilityCol, lpuSchoolsArr) {
        if (!cellValue) return '-';
        let str = cellValue.toString().replace(/\\n/g, '<br>'); // Handle literal newlines and escaped

        // If this is the eligibility column and we mapped schools, render pill tags
        if (isEligibilityCol && lpuSchoolsArr && lpuSchoolsArr.length > 0) {
            let tagsHtml = `<div class="tag-container">`;
            lpuSchoolsArr.forEach(sch => {
                tagsHtml += `<span class="school-tag">${sch}</span>`;
            });
            tagsHtml += `</div>`;
            return tagsHtml; // Replace the messy text entirely with clean tags
        }

        // Format URLs as buttons
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        str = str.replace(urlRegex, '<a href="$1" target="_blank" class="link-btn">Visit Link</a>');

        // Email detection
        const emailRegex = /([a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9_-]+)/gi;
        str = str.replace(emailRegex, '<a href="mailto:$1">$1</a>');

        return str;
    }

    // Render HTML table
    function renderTable(parsedData) {
        tableHeaderRow.innerHTML = '';
        tableBody.innerHTML = '';

        if (!parsedData || parsedData.rows.length === 0) {
            noResults.classList.remove('hidden');
            noResults.innerHTML = `<p>No ${currentViewToken} data available for this ministry.</p>`;
            tableContainer.classList.add('hidden');
            return;
        } else {
            noResults.classList.add('hidden');
            tableContainer.classList.remove('hidden');
        }

        parsedData.headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            tableHeaderRow.appendChild(th);
        });

        parsedData.rows.forEach(row => {
            const tr = document.createElement('tr');

            if (row.type === 'section') {
                tr.className = 'section-header-row';
                const td = document.createElement('td');
                td.colSpan = parsedData.headers.length;
                td.textContent = row.title;
                tr.appendChild(td);
            } else {
                row.cells.forEach((cell, idx) => {
                    const td = document.createElement('td');
                    // Usually the last column in opportunities is Eligibility
                    const isEligibilityCol = (currentViewToken === 'opportunities' && idx === row.cells.length - 1);
                    td.innerHTML = formatCell(cell, isEligibilityCol, row.lpuSchools);
                    tr.appendChild(td);
                });
            }
            tableBody.appendChild(tr);
        });
    }

    // Search within active table data
    dataSearch.addEventListener('input', handleTableFilter);

    function handleTableFilter() {
        if (!currentParsedData || currentParsedData.rows.length === 0) return;
        const query = dataSearch.value.toLowerCase();

        const filteredRows = currentParsedData.rows.filter(row => {
            if (row.type === 'section') return true;

            // Global School Filter logic for Table
            if (currentViewToken === 'opportunities' && currentSchoolFilter !== 'ALL') {
                if (!row.lpuSchools || !row.lpuSchools.includes(currentSchoolFilter)) {
                    return false; // Hide if it doesn't match the selected school
                }
            }

            // Text search logic
            if (query === '') return true;

            return row.cells.some(cell => {
                if (cell === null) return false;
                return cell.toString().toLowerCase().includes(query);
            });
        });

        const cleanFilteredRows = [];
        for (let i = 0; i < filteredRows.length; i++) {
            const cur = filteredRows[i];
            if (cur.type === 'section') {
                if (i === filteredRows.length - 1 || filteredRows[i + 1].type === 'section') continue;
            }
            cleanFilteredRows.push(cur);
        }

        renderTable({ headers: currentParsedData.headers, rows: cleanFilteredRows });

        if (cleanFilteredRows.length === 0) {
            noResults.classList.remove('hidden');
            noResults.innerHTML = '<p>No matching results found for your search.</p>';
            tableContainer.classList.add('hidden');
        } else {
            noResults.classList.add('hidden');
            tableContainer.classList.remove('hidden');
        }
    }
});
