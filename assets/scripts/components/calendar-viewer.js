customElements.define('calendar-viewer', class extends HTMLElement { 
    constructor () {
        super();

        /* Selectors */
        this.CALENDAR_TOOLBAR = '[data-calendar-toolbar]';
        this.CALENDAR_VIEW = '[data-calendar-view]'; 
        this.CALENDAR_INFO_PANEL = '[data-calendar-info]'; 
        this.INFO_TITLE = '[data-calendar-title]'; 
        this.INFO_SUBTITLE = '[data-calendar-subtitle]';
        this.INFO_TAB_CONTROLS = '[data-tab-controls]';
        this.INFO_TABS = '[data-calendar-tab]';
        this.INFO_TAB_PANELS = '[data-tab-panel]';
        this.INFO_TAG_TEMPLATE = '[data-tag-template]';
        this.NEXT_MONTH_BTN = '[data-next-month]';
        this.PREV_MONTH_BTN = '[data-prev-month]';

        /* Month ID Selectors */
        this.MONTHS = [ "#JAN", "#FEB", "#MAR", "#APR", "#MAY", "#JUN", "#JUL", "#AUG", "#SEP", "#OCT", "#NOV", "#DEC" ];

        //month data to store json array after request
        this.monthData = [];

        //last selected month's highlight
        this.lastActiveHighlight;

        //currently selected month's index
        this.currentMonthIndex = 0;
    }

    connectedCallback() {
        this.setupComponent();
    }

    setupComponent() {
        /*
         * Get Provided Attributes
         */

        //supporting element selectors
        this.calendarDataPath = this.getAttribute('calendar-data');

        //request json data and store it for use
        this.getDataFromJSON(this.calendarDataPath, (data) => {
            this.monthData = data;
        });

        /*
         * Cached Expected Elements (Expected to exist inside this component)
         */

        //get calendar view element (root of calendar view/stage)
        this.calendarViewElement = document.querySelector(this.CALENDAR_VIEW);

        //get all month highlight elements using months id array
        this.monthHighlights = Array.from(this.querySelectorAll(this.MONTHS.join(",")));

        //get next and prev month buttons
        this.nextMonthBtnElement = this.querySelector(this.NEXT_MONTH_BTN);
        this.prevMonthBtnElement = this.querySelector(this.PREV_MONTH_BTN);

        //get the tab controls
        this.infoTabControls = this.querySelector(this.INFO_TAB_CONTROLS);

        //hide the tab controls by default
        if (this.infoTabControls) {
            this.infoTabControls.classList.add('hide');
        }

        //get all tabs in the info panel
        this.infoTabElements = Array.from(this.querySelectorAll(this.INFO_TABS));

        //get info panel title & subtitle elements
        this.infoTitleElement = this.querySelector(this.INFO_TITLE);
        this.infoSubTitleElement = this.querySelector(this.INFO_SUBTITLE);

        //get all tab panels
        this.infoPanelElements = Array.from(this.querySelectorAll(this.INFO_TAB_PANELS));

        //template for info tags to use in info panel
        this.infoTagTemplate = this.querySelector(this.INFO_TAG_TEMPLATE);

        //setup listeners
        this.setupListeners();
    }

    setupListeners() {
        /* MONTH HIGHLIGHTS */
        if (this.monthHighlights.length > 0) {
            /* MONTH HIGHLIGHTS (Click Events) */
            this.monthHighlights.forEach(highlight => {
                highlight.addEventListener('click', () => {
                    this.setActiveMonthHighlight(highlight);
                    this.matchDataToHighlight(highlight);
                });
            });

            /* MONTH HIGHLIGHTS (Keyboard Events) */
            this.monthHighlights.forEach(highlight => {
                highlight.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        this.setActiveMonthHighlight(highlight);
                        this.matchDataToHighlight(highlight);
                    }
                });
            });
        }

        /* Next Month Button */
        if (this.nextMonthBtnElement) {
            this.nextMonthBtnElement.addEventListener('click', () => {
                this.goToNextMonth();
            });
        }

        /* Previous Month Button */
        if (this.prevMonthBtnElement) {
            this.prevMonthBtnElement.addEventListener('click', () => {
                this.goToPreviousMonth();
            });
        }
    }

    /*================
     * EVENT METHODS
     =================*/
    matchDataToHighlight(highlight) {
        this.monthData.filter(data => {
            //normalize month shortnames and ids
            const shortName = data.short.toLocaleLowerCase().trim();
            const idName = highlight.id.toLocaleLowerCase().trim();

            //check for matches and update info panel
            if (shortName === idName) {
                this.currentMonthIndex = data.id;
                this.updateInfoPanel(data);
            }
        });  
    }

    setActiveMonthHighlight(highlight) {
        //remove highlight from the last active highlight
        if (this.lastActiveHighlight)
            this.lastActiveHighlight.classList.remove("active");      

        //set the active style for the new selection
        highlight.classList.add("active");

        //save the new seletion as the last selected highlight
        this.lastActiveHighlight = highlight;
    }

    goToNextMonth() {
        this.currentMonthIndex++;

        if (this.currentMonthIndex > 12) {
            this.currentMonthIndex = 1;
        }

        //match month data based on id
        const toMonth = this.monthData.find(month => { return month.id === this.currentMonthIndex; });
        const monthShortName = toMonth.short.toUpperCase().trim();

        //match highlight by month data short name
        const toHighlight = this.getHighlightFromShortName(monthShortName);

        //update active month highlight
        this.setActiveMonthHighlight(toHighlight);

        //update info panel
        this.updateInfoPanel(toMonth);
    }

    goToPreviousMonth() {
        this.currentMonthIndex--;

        if (this.currentMonthIndex < 1) {
            this.currentMonthIndex = 12;
        }

        //match month data based on id
        const toMonth = this.monthData.find(month => { return month.id === this.currentMonthIndex; });
        const monthShortName = toMonth.short.toUpperCase().trim();

        //match highlight by month data short name
        const toHighlight = this.getHighlightFromShortName(monthShortName);

        //update active month highlight
        this.setActiveMonthHighlight(toHighlight);

        //update info panel
        this.updateInfoPanel(toMonth);
    }

    /*================
     * UI METHODS
     =================*/
    updateInfoPanel(monthObject) {
        //ensure we're working with an actual object
        if (monthObject === null || typeof monthObject !== 'object' || Array.isArray(monthObject))
            return;

        //update tabs and resource lists
        this.updateTabs(monthObject);

        //set title if the element & name key are available
        if (this.infoTitleElement && monthObject.name !== undefined)
            this.infoTitleElement.textContent = monthObject.name;

        //set subtitle if the element & season key are available
        if (this.infoSubTitleElement && monthObject.season !== undefined)
            this.infoSubTitleElement.textContent = monthObject.season;
    }

    updateTabs(monthObject) {
        //ensure we're working with an actual object
        if (monthObject === null || typeof monthObject !== 'object' || Array.isArray(monthObject))
            return;

        //show the controls now that we have info
        if (this.infoTabControls) {
            this.infoTabControls.classList.remove('hide');
        }

        //go through each object key of 'resources' from the month object and determine which tabs need disabled or not
        //CONSIDER: Perhaps not disabling the tab and just showing "No resources mapped" instead
        if (Object.hasOwn(monthObject, 'resources') && this.infoTabElements) {
            Object.entries(monthObject.resources).forEach(([key, value]) => {
                this.infoTabElements.forEach(tab => {
                    //normalize month shortnames and ids
                    const keyName = key.toLowerCase().trim();
                    const tabName = tab.name.toLowerCase().trim();

                    //check for matches between tab and key
                    if (tabName === keyName) {
                        if (value.size === 0) {
                            tab.disabled = true;
                        } else {
                            this.updateTabPanels(key, value);
                        }
                    }
                });
            });
        }
    }

    updateTabPanels(panelName, resourceArray) {
        //ensure we're working with an actual array
        if (!Array.isArray(resourceArray))
            return;

        //loop through all panels to build out their content (if any)
        this.infoPanelElements.forEach(panel => {
            //if we have a match in panels matching the given panel name
            if (panel.dataset.tabName === panelName) {
                //create a document fragment to hold the new html
                const docFrag = new DocumentFragment();

                //create the ul element
                const uList = document.createElement('ul');
                uList.classList.add("list-unstyled", "d-flex", "flex-wrap", "gap-2", "mt-3");

                //build a list item for each resource
                resourceArray.forEach(resource => {
                    //clone the list item 'info tag' template
                    const infoTag = this.infoTagTemplate.content.cloneNode(true);

                    //get the list item in the template
                    const lItem = infoTag.querySelector('li');

                    //tag title element
                    const tagTitle = infoTag.querySelector('.tag-title');

                    //progress bar for in season percentages
                    const progressElement = infoTag.querySelector('.progress');
                    const progressBar = infoTag.querySelector('.progress-bar');
                    const fillColorClass = `bg-${panel.dataset.tabName.toLowerCase().trim().replace('_', '-')}`;
                    
                    //default values for progress fill & direction
                    let fillDirection = "ltr";
                    let percentWidth = "100";

                    //determine fill direction of progress bar and fill width by destructuring the fill_class value (if it includes a hyphen)
                    if (resource.fill_class && resource.fill_class.includes("-")) {
                        const [direction, width] = resource.fill_class.split("-");
                        const fillWidth = parseInt(width, 10);

                        //if the fill class direction segment is equal to 'start' make the fill direction ltr otherwise make it rtl
                        fillDirection = (direction === 'start') ? 'ltr' : 'rtl';
                        
                        //set width to numeric segment of fill_class
                        percentWidth = `${fillWidth}`;
                    } else if (resource.fill_class === 'none' || !resource.fill_class) {
                        //just set width to zero
                        percentWidth = '0';
                    }

                    //check if there is tooltip_text key in this object and create a bs tooltip on the list item,
                    //otherwise just set the resource name only
                    if (Object.hasOwn(resource, 'tooltip_text')) {
                        this.setupInfoTagTooltip(tagTitle, lItem, resource);
                    } else {
                        //set text content name only
                        tagTitle.textContent = resource.name;
                    }
                    
                    //set progress bar attributes and fill width
                    if (progressElement && progressBar) {
                        //set fill color of progress bar
                        progressBar.classList.add(fillColorClass);

                        //set fill direction of progress element
                        progressElement.setAttribute('dir', fillDirection);

                        //set aria value now of progress element
                        progressElement.setAttribute('aria-valuenow', percentWidth);

                        //set width of progress bar
                        progressBar.style.width = `${percentWidth}%`;
                    }

                    //append the list item to the unordered list
                    uList.appendChild(infoTag);
                });

                //append the unordered list to the document fragment
                docFrag.appendChild(uList);

                //append the document fragment to the given panel
                panel.replaceChildren(docFrag);
            }
        });
    }

     /*================
     * TEMPLATE METHODS
     =================*/  
    setupInfoTagTooltip(tagTitleElement, infoTagElement, resource) {
        //set li to position relative
        infoTagElement.classList.add("position-relative");

        //set tooltip info for this list item
        infoTagElement.setAttribute("data-bs-toggle", "tooltip");
        infoTagElement.setAttribute("data-bs-title", resource.tooltip_text);
        infoTagElement.setAttribute('aria-description', resource.tooltip_text);

        //create the info badge to show this item has tooltip info
        const badge = document.createElement('span');
        badge.classList.add("position-absolute", "top-0", "start-100", "translate-middle", "badge", "rounded-circle", "bg-dark");
        badge.textContent = 'i';

        //set text content name
        tagTitleElement.textContent = resource.name;

        //append any badges
        infoTagElement.append(badge);                        

        //initialize a new bootstrap tooltip item
        if (typeof bootstrap !== 'undefined')
            new bootstrap.Tooltip(infoTagElement);
    }

    /*================
     * UTIL METHODS
     =================*/
    getHighlightFromShortName(shortName) {
        if (this.monthHighlights.length === 0)
            return null;

        const toHighlight = this.monthHighlights.find(highlight => { 
            const highlightShortName = highlight.id.toUpperCase().trim();

            if (highlightShortName === shortName)
                return highlight;
        });

        return toHighlight;
    }

    /**
     * @summary Gets JSON data from a given path using a web request - https://youmightnotneedjquery.com/
     */
    getDataFromJSON(path, callback) {
         let request = new XMLHttpRequest();
        request.open('GET', path, true);

        request.onload = function () { 
            if (this.status >= 200 && this.status < 400) {
                try {
                    // success!
                    let data = JSON.parse(this.response);
                    callback(data);
                } catch(error) {
                    console.error(`Error parsing JSON from ${path}`, error);
                    callback(null);
                }
            } else {
                // we reached our target server, but it returned an error
                console.warn(`The resource at ${path} returned an error: ${this.status}`);
                callback(null);
            }
        };

        request.onerror = function () {
            console.warn(`The resource at ${path} could not be loaded (network error).`);
            callback(null);
        };

        request.send();       
    }
});