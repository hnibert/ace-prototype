class AdvancedSearch {
    constructor(options = {}) {
        //filter toggle constants
        this.SEARCH_INPUT = '[data-search-input]';
        this.CLEAR_INPUT = '[data-clear-input]';

        //filter toggle constants
        this.FILTER_TOGGLE = '[data-search-filter]';
        this.CLEAR_ALL_FILTERS = '[data-clear-all-filters]';
        this.CLEAR_FILTERS_GROUP = '[data-clear-group-filters]';

        //pagination constants
        this.PAGE_NEXT = '[data-page-next]';
        this.PAGE_PREV = '[data-page-previous]';

        //search data 
        this.searchDataSelector = options.searchData ?? '';

        //template element selector
        this.resultTemplateSelector = options.resultTemplate ?? '';

        //filter fields (maps to activeFields)
        this.filterFields = options.filterFields ?? null;

        //active fields (created from filterFields)
        this.activeFilters = this.filterFields ?? null;

        //range inputs & options
        this.searchRanges = options.ranges ?? [];

        //minisearch config options
        this.msFields = options.searchConfig?.msFields ?? [];
        this.msStoreFields = options.searchConfig?.msStoreFields ?? [];
        this.msBoostFields = options.searchConfig?.msBoostFields ??  null;

        //container selectors
        this.searchContainerSelector = options.containers?.searchContainer ?? '';
        this.resultsContainerSelector  = options.containers?.resultsContainer ?? '';

        //pagination selector & options
        this.paginationControlSelector = options.pagination?.paginationControls ?? '';
        this.paginationProgressSelector = options.pagination?.paginationProgressBar ?? '';
        this.resultsPerPage = options.pagination?.resultsPerPage ?? 3;
        this.currentPage = 1;

        //summary text selectors
        this.pageIndexSummarySelector = options.summary?.pageIndexSummary ?? '';
        this.pageResultSummarySelector = options.summary?.pageResultSummary ?? '';
        this.noResultsSelector = options.summary?.noResultsFeedback ?? '';

        //get custom search filter logic
        this.searchFilterMethod = options.filterLogic ?? this.defaultFilterLogic;

        //get custom  template render method
        this.renderTemplateMethod = options.renderLogic ?? null;

        //setup minisearch and the component
        this.initialize();
    }

    initialize() {
        if (typeof MiniSearch !== 'undefined') {

            //initialize minisearch with our options
            this.miniSearch = new window.MiniSearch({
                fields: this.msFields,           //fields to search/index for text input
                storeFields: this.msStoreFields, //fields to return for results
                searchOptions: {
                    boost: this.msBoostFields,   // boost object for matching text
                    prefix: true,                // matches terms that start with the query
                    //prefixLength: 3,           // first 3 characters must be exact
                    fuzzy: 2                     // enable fuzzy matching
                }
            });
        } else {
            console.error("Error: MiniSearch is not loaded on this page!");
        }

        //setup component elements
        this.setupComponent();
    }

    /* 
        SETUP ELEMENT METHODS
    */
    setupComponent() {
        //script holding raw json text string for search
        this.searchIndexElement = document.querySelector(this.searchDataSelector);

        //setup minisearch with the given json data
        this.setupSearchDocuments();

        //get the result template element
        this.resultTemplate = this.resultTemplateSelector ? document.querySelector(this.resultTemplateSelector) : null;

        //get the search container element
        this.searchContainerElement = this.searchContainerSelector ? document.querySelector(this.searchContainerSelector) : null;
        
        //get elements expected in the search container
        if (this.searchContainerElement) {
            this.getSearchElements();
        }

        //get the results container element
        this.resultsContainerElement = this.resultsContainerSelector ? document.querySelector(this.resultsContainerSelector) : null;

        //get the pagination controls element
        this.paginationControlsElement = this.paginationControlSelector ? document.querySelector(this.paginationControlSelector) : null;

        //get elements expected in the pagination controls
        if (this.paginationControlsElement) {
            this.getPaginationElements();
        }

        //get summary elements
        this.getSummaryElements();

        /*
         * Set flags based on what expected input elements were found
         */
        this.hasSearchInput = !!this.searchInputElement;
        this.hasFilters = this.searchFilterElements.length > 0;
        this.hasRangeInputs = this.searchRanges.length > 0;

        //setup component listeners with elements
        this.setupListeners();
    }

    getSearchElements() {
        /*
            SEARCH INPUT
        */
        //search input field element
        this.searchInputElement = this.searchContainerElement.querySelector(this.SEARCH_INPUT);

        //clear search input element
        this.clearSearchInputElement = this.searchContainerElement.querySelector(this.CLEAR_INPUT);

        //filter toggle elements
        this.searchFilterElements = Array.from(this.searchContainerElement.querySelectorAll(this.FILTER_TOGGLE));

        /*
            FILTER TOGGLES
        */
        //clear toggle category btns
        this.clearToggleGroupElements = Array.from(this.searchContainerElement.querySelectorAll(this.CLEAR_FILTERS_GROUP));

        //hide the clear toggle group buttons by default
        this.clearToggleGroupElements.forEach(clearBtn => {
            clearBtn.classList.add("hide");
        });

        //clear all toggles btn
        this.clearAllTogglesBtnElement = this.searchContainerElement.querySelector(this.CLEAR_ALL_FILTERS);

        /*
            RANGE SLIDERS
        */
        if (this.searchRanges.length > 0) {
            for (let i = 0; i < this.searchRanges.length; i++) {
                //grab the range element from the DOM
                const rangeElement = this.searchRanges[i].rangeInput ? this.searchContainerElement.querySelector(this.searchRanges[i].rangeInput) : null;
                //console.log(this.searchRanges[i].rangeElement);

                if (rangeElement) {
                    //add this key to the search range object
                    this.searchRanges[i].rangeElement = rangeElement;
                }
            }
        }
    }

    getPaginationElements() {
        //next page button
        this.pageNextBtn = this.paginationControlsElement.querySelector(`${this.PAGE_NEXT}`);

        //previous page button
        this.pagePreviousBtn = this.paginationControlsElement.querySelector(`${this.PAGE_PREV}`); 

        //pagination progress bar element (optional)
        this.paginationProgressElement = this.paginationProgressSelector ? document.querySelector(this.paginationProgressSelector) : null;
    }

    getSummaryElements() {
        //page index summary text
        this.pageIndexSummaryElement = this.pageIndexSummarySelector ? document.querySelector(this.pageIndexSummarySelector) : null;

        //page results summary text
        this.pageResultSummaryElement = this.pageResultSummarySelector ? document.querySelector(this.pageResultSummarySelector) : null;

        this.noResultsElement = this.noResultsSelector ? document.querySelector(this.noResultsSelector) : null;
        
        //hide no results element by default
        this.noResultsElement.style.display = "none";
    }

    /* 
        SETUP LISTENER METHODS
    */

    setupListeners() {
        /*
         * Setup Listeners based on input flags
         */

        //handle enter key on form if one exist
        this.searchContainerElement.querySelector('form')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });

        /* TEXT SEARCH */
        if (this.hasSearchInput) {
            //search text input with a debounce 
            //https://www.geeksforgeeks.org/javascript/debouncing-in-javascript/

            //define a timer
            let timer;

            this.searchInputElement.addEventListener('input', () => {
                //clear timer
                clearTimeout(timer);
                
                //set timer & perform search after wait
                timer = setTimeout(() => {this.executeSearch(); }, this.debounceTime);
            });

            //clear search input btn
            if (this.clearSearchInputElement) {
                this.clearSearchInputElement.addEventListener('click', () => {
                    this.clearSearchInput();
                });
            }
        }

        /* RANGE INPUTS */
        if (this.hasRangeInputs) {
            this.searchRanges.forEach(range => {
                //ensure the range element exist before binding an event to it
                if (range.rangeElement) {
                    
                    //initialize the range slider values
                    if (typeof range.rangeInitiateMethod === 'function') {
                        range.rangeInitiateMethod(range.rangeElement, range.rangeFields);
                    }

                    //add the event listener to the range element
                    range.rangeElement.addEventListener(range.rangeEvent, (e) => {
                        //pass the event and range fields to the event method, if it exist
                        if (typeof range.rangeEventMethod === 'function') {
                            range.rangeEventMethod(e, range.rangeFields);
                        }

                        //do the search with new search params
                        this.executeSearch();
                    });
                }
            });
        }

        /* FILTER TOGGLES */
        if (this.hasFilters) {
            //filter toggle btns
            this.searchFilterElements.forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    this.updateActiveFilters(e);
                    this.executeSearch();
                });
            });

            //clear filter category btns
            this.clearToggleGroupElements.forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    this.clearFilterCategory(e);
                });
            });

            //clear all filters
            if (this.clearAllTogglesBtnElement) {
                this.clearAllTogglesBtnElement.addEventListener('click', () => {
                    this.clearAllFilters();
                });
            }
        }

        /* RESET SEARCH BUTTON */
        if (this.resetSearchBtnElement) {
            this.resetSearchBtnElement.addEventListener('click', () => {
                this.resetSearch();
            });
        }

        /* PAGINATION BUTTONS */

        //next page btn
        if (this.pageNextBtn) {
            this.pageNextBtn.addEventListener('click', () => {
                this.goToNextPage();
            });
        }

        //previous page btn
        if (this.pagePreviousBtn) {
            this.pagePreviousBtn.addEventListener('click', () => {
                this.goToPreviousPage();
            });
        }

        //get url parameters to set default search from if any exist
        //see: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
        //see: https://sentry.io/answers/how-to-get-values-from-urls-in-javascript/
        if (window.location.search) {
            this.setDefaultSearchFromURL();
        }

        //run the 'default' search to bring up results immediately on page load
        this.executeSearch();
    }

    /* 
        MINISEARCH / SEARCH METHODS
    */
    
    setupSearchDocuments() {
        if (!this.searchIndexElement) {
            console.warn(`Faceted Search: Could not find script element with ID "${this.searchDataSelector}".`);
            return;            
        } else {
            /* parse the JSON we get from searchIndexElement */
            try {
                //parse the given raw string into a js object array
                const parsedJSON = JSON.parse(this.searchIndexElement.textContent);

                //add an 'id' key to each entry in parsedJSON - minisearch needs id keys
                this.searchDocs = parsedJSON.map((item, index) => ({
                    ...item, 
                    id: index
                }));

                //setup minisearch.js with our searchDocs array
                this.initializeMiniSearch(this.searchDocs);

            } catch(error) {
                console.error('Faceted Search: Failed to parse JSON data.', error);
            }
        }
    }

    initializeMiniSearch(searchDocuments) {
        //console.log("Adding search documents to minisearch:");
        //console.log(this.searchDocs);

        //check we receieved an array to build the minisearch index map with
        if (Array.isArray(searchDocuments)) {
            this.miniSearch.addAll(searchDocuments);
        }
    }

    executeSearch() {
        //get the input text and normalize it
        const query = this.searchInputElement.value.toLowerCase().trim();

        //console.log(query);
        //console.log("---Current Active Filters:", this.activeFilters);

        if (query === "") {
            //skip minisearch and just use custom filtering
            this.results = this.searchDocs.filter(item => {
                return this.filterSearchResult(item);
            });
        } else {
            //use minisearch + any custom filtering
            this.results = this.miniSearch.search(query, {
                //use the filter option to match tags, check each result for tag matches
                //each 'result' is an object with all its key/values from searchDocs
                filter: (result) => {
                    return this.filterSearchResult(result);
                }
            });
        }

        //build/update the search parameters endpoint
        this.buildURLEndpoint();

        //toggle no results UI
        this.toggleNoResults();

        //update pagination info
        this.updatePaginationResults(this.results);
    }

    filterSearchResult(result) {
        //category and tag match check
        const hasTagMatch = this.searchFilterMethod(result, this.activeFilters);

        const isRangeMatch = () => {
            //range match check, if any ranges exist, 
            //ensure every range is a match for this result
            return this.searchRanges.every(range => {
                if (range.rangeElement && typeof range.rangeFilterLogic === 'function') {
                    return range.rangeFilterLogic(result, range.rangeFields);
                }

                //there was no range logic, just return true
                return true;
            });
        };

        const hasRangeMatch = this.hasRangeInputs ? isRangeMatch() : true;

        if (hasTagMatch && hasRangeMatch) {
            return true;
        }

        return false;
    }

    setDefaultSearchFromURL() {
        //https://www.greatfrontend.com/questions/quiz/how-do-you-get-the-query-string-values-of-the-current-page-in-javascript
        const searchQueryString = decodeURIComponent(window.location.search);
        const searchParameters = new URLSearchParams(searchQueryString);

        //set the input value from the 'query' parameter if it exist, otherwise keep it empty
        this.searchInputElement.value = searchParameters.get("query") || "";

        //go through each active filters category key and check if search parameters has a match
        Object.keys(this.activeFilters).forEach(category => {
            //does search parameters have this category key?
            if (searchParameters.has(category)) {
                //get the string value from that category parameter
                const value = searchParameters.get(category);

                //assign an array of values split on ',' if value exist, otherwise assign an empty array
                this.activeFilters[category] = value ? value.split(",") : [];
            }
        });

        //with active filters updated from the URL go ahead and update the checkboxes
        this.setFilterToggles();
    }

    /* 
        INPUT METHODS
    */
    clearSearchInput() {
        //set text input value to empty
        this.searchInputElement.value = "";

        //re-run search with empty value
        this.executeSearch();
    }

    /* 
        FILTER METHODS
    */
    defaultFilterLogic(result, activeFilters) {
        //go through each entry in activeFilters object - destructure each as 'category' and 'activeTags'
        return Object.entries(activeFilters).every(([category, activeTags]) => {
            //skip empty categories and return true for this result
            if (activeTags.length === 0)
                return true;

            //get the category tag array form this result
            //these match up between active filters entries and resource keys in each result
            const resultCategoryTags = result[category];

            //check to make sure this field is an array, if it is see if there are any tag matches in that array
            if (Array.isArray(resultCategoryTags)) {
                //return ture/false if this array has _some_ tags that match active filters category tags
                return resultCategoryTags.some(tag => activeTags.includes(tag));
            }

            //otherwise it's not an array, just check if the active filters category 'tags' includes the result category value
            return activeTags.includes(resultCategoryTags);
        });
    }

    updateActiveFilters(e) {
        //get the name and value from the toggle btn
        const { name, value } = e.currentTarget; 

        //get the category in active filters array by name given from the toggle btn name attrb
        const currentCategory = this.activeFilters[name];

        //get the index of the tag in its category (if it exist, otherwise it will be -1)
        const tagIndex = currentCategory.indexOf(value);

        //add or remove the tag to its given category
        if (tagIndex > -1) {
            //remove this tag from active category filters
            currentCategory.splice(tagIndex, 1);
        } else {
            //add this tag to active category filters
            currentCategory.push(value);
        }

        //toggle the clear toggle
        this.toggleClearGroupButton(currentCategory.length, name);
    }

    setFilterToggles() {
        //go through all active filter entries - for each category and its tags
        Object.entries(this.activeFilters).forEach(([category, tags]) => {
            //get all toggles with a matching category name from toggles array
            const categoryBtns = this.searchFilterElements.filter(toggle => {
                return toggle.name === category;
            });

            //go through each tag in tags
            tags.forEach(tag => {
                //go through each toggle btn
                categoryBtns.forEach((toggle) => {
                    //check if the toggles value is equal to the tag and check it if true
                    if (toggle.value === tag)
                        toggle.checked = true;
                });
            }); 
            
            //toggle the clear toggle btn
            this.toggleClearGroupButton(tags.length, category);
        });
    }

    clearFilterCategory(e) {
        //get the name (category) from the clicked toggle
        const { name } = e.currentTarget;

        //get the category in active filters array by name given from the toggle btn name attrb
        const currentCategory = this.activeFilters[name];

        //get all toggles with a matching name from toggles array
        const categoryBtns = this.searchFilterElements.filter(toggle => {
            return toggle.name === name;
        });

        //set all toggles to unchecked
        categoryBtns.forEach(toggle => {
            toggle.checked = false;
        });

        //clear the current category in active filters manually
        currentCategory.length = 0;

        //toggle clear category btn
        this.toggleClearGroupButton(currentCategory.length, name);

        //re-run the search
        this.executeSearch();
    }

    clearAllFilters() {
        //uncheck all toggle elements
        this.searchFilterElements.forEach(toggle => {
            toggle.checked = false;
        });

        //loop through all entries in active filters and empty them
        Object.keys(this.activeFilters).forEach(category => {
            //clear each category 
            this.activeFilters[category].length = 0;

            //toggle the categories clear button
            this.toggleClearGroupButton(0, category);
        });

        //re-run the search
        this.executeSearch();
    }

    /* 
        RANGE METHODS
    */
    defaultRangeLogic(result, activeRanges) {

    }

    /* 
        PAGINATION METHODS
        see: https://www.geeksforgeeks.org/javascript/create-a-pagination-using-html-css-and-javascript/?_x_tr_hist=true
    */ 
    updatePaginationResults(results) {
        if (!Array.isArray(results))
            return;

        //recalculate total pages based on new results length and round to the largest int
        this.totalPages = Math.ceil(results.length / this.resultsPerPage);

        //reset current page
        this.currentPage = 1;

        //render the first page of results
        this.displayPage(this.currentPage);
    }

    displayPage(page) {
        //calculate start and end index for results to display on this page
        const startIndex = (page - 1) * this.resultsPerPage;
        const endIndex = Math.min(startIndex +  this.resultsPerPage, this.results.length);

        //get the items to display for this page
        const pageItems = this.results.slice(startIndex, endIndex);

        //render a batch of results as page items
        this.renderPageResults(pageItems, startIndex, endIndex);
    }

    renderPageResults(results, startIndex, endIndex) {
        //clear any html in the results container
        this.resultsContainerElement.innerHTML = '';

        //page document fragment
        const pageFragment = new DocumentFragment();

        //loop through results and render them using a template
        results.forEach(result => {
            this.renderTemplateMethod(result, pageFragment, this.resultTemplate)
        });

        //append the page fragment to the results container
        this.resultsContainerElement.appendChild(pageFragment);

        //update pagination controls
        this.updatePaginationControls();

        //update pagination UI
        this.updatePaginationSummary(startIndex, endIndex);
    }

    goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.displayPage(this.currentPage);
        }
    }

    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayPage(this.currentPage);
        }
    }

    /* 
        UI METHODS
    */ 
    toggleClearGroupButton(count, name) {
        const clearGroupBtn = this.getClearToggleGroupBtn(name);

        //check if we need to show the clear category button
        if (count > 0) {
            if (clearGroupBtn.classList.contains("hide")) {
                clearGroupBtn.classList.remove("hide");
                clearGroupBtn.removeAttribute("disabled");
            }
        } else {
            clearGroupBtn.classList.add("hide");
            clearGroupBtn.setAttribute("disabled", "");
        }
    }

    toggleNoResults() {
        if (this.results.length === 0) {
            this.noResultsElement.style.display = "";
        } else {
            this.noResultsElement.style.display = "none";
        }
    }

    updatePaginationSummary(startIndex, endIndex) {
        const resultsLength = this.results.length;

        //Showing (X - Y) of (Z) results
        if (this.pageResultSummaryElement)
            this.pageResultSummaryElement.textContent = (resultsLength >= 1) ? `Showing (${startIndex + 1} - ${endIndex}) of (${resultsLength}) results` : "No Results";

        //Page X of Y
        if (this.pageIndexSummaryElement)
            this.pageIndexSummaryElement.textContent = (resultsLength >= 1) ? `Page ${this.currentPage} of ${this.totalPages}` : "";

        //pagination progress bar
        if (this.paginationProgressElement) {
            const progressFill = this.paginationProgressElement.querySelector(".progress-bar");
            const progress = Math.floor((resultsLength >= 1) ? (this.currentPage / this.totalPages) * 100 : 0);

            this.paginationProgressElement.setAttribute("aria-valuenow", progress);
            progressFill.style.width = `${progress}%`;
        }
    }

    updatePaginationControls() {
        this.pagePreviousBtn.disabled = this.currentPage === 1; 
        this.pageNextBtn.disabled = this.currentPage === this.totalPages;
    }

    /* 
        UTIL METHODS
    */    
    resetSearch() {
        //set text input value to empty
        this.searchInputElement.value = "";

        //clear all filters and allow it to execute the search again
        this.clearAllFilters();
    }

    getClearToggleGroupBtn(groupName) {
        //return a button that has a name value that matches the group value, otherwise return null
        return this.clearToggleGroupElements.find(clearBtn => clearBtn.name === groupName) ?? null;
    }

    /* 
        URL - SEARCH PARAMETER METHODS
    */    
    //see: https://gomakethings.com/articles/how-to-build-a-query-string-from-an-object-of-data-with-vanilla-js/
    buildURLQuery(data) {
        //don't add empty parameters
        //see: https://stackoverflow.com/questions/62989310/how-to-remove-empty-query-params-using-urlsearchparams?rq=3
        let searchParameters = new URLSearchParams(data);
        let emptyNullKeys = [];

        //go through search param entries and check for emtpy values
        //value has to be before key...
        searchParameters.forEach((value, key) => {
            if (value === '') {
                emptyNullKeys.push(key);
            }
        });

        //delete empty keys from search params
        emptyNullKeys.forEach(key => {
            searchParameters.delete(key);
        });

	    return searchParameters.toString();
    }

    buildURLEndpoint() {
        //get base path
        const basePath = window.location.pathname;

        //normalize search query and current page number
        const query = this.searchInputElement.value.toLowerCase().trim();
        //const page = this.currentPage || 1; 

        //build a new object containing all our search parameters together
        const finalParameterObject = {
            query, //get the search query
            ...this.activeFilters //clone active filters object ot here
            //page
        };

        //build a new url query with all the info it needs
        const newQueries = `${this.buildURLQuery(finalParameterObject)}`;

        //build the final endpoint
        const endpoint = `${basePath}?${newQueries}`;

        //update the address bar without reloading
        window.history.replaceState(null, '', endpoint);
    }
}