customElements.define('basic-search', class extends HTMLElement { 
    constructor () {
        super();

        /* Constants */
        this.ACTIVE_CLASS = 'active';
        this.HIDDEN_CLASS = 'is-hidden';
        this.ALL_KEYWORD = 'all';

        /* Selectors */
        this.SEARCH_INPUT = '[data-search-input]';
        this.CLEAR_INPUT = '[data-clear-input]';
        this.SELECT_INPUT = '[data-search-select]';
        this.FILTER_TOGGLE = '[data-search-filter]';
        this.CLEAR_FILTERS = '[data-clear-filters]';
        this.DATA_FILTER_FOR = 'data-filter-for';
        this.SEARCH_ITEM = '[data-search-item]';
        this.SEARCH_TEXT = '[data-search-text]';
        this.RESET_SEARCH = '[data-search-reset]';

        //store active filters
        this.activeFilters = [];

        /* Flags */
        this.hasSearchInput = false;
        this.hasSearchSelect = false;
        this.hasFilters = false;

        // Counter tracking active matches
        this.resultsCount = 0;
    }

    connectedCallback() {
        this.setupComponent();
    }

    setupComponent() {

        /* Get Provided Attributes */

        //supporting element selectors
        this.searchContainerSelector = this.getAttribute('search-container');
        this.summaryTextSelector = this.getAttribute('summary-text');
        this.noResultsSelector = this.getAttribute('no-results');

        //data attribute to be searched for by filter search (if used)
        this.searchSelectorDataTarget = this.getAttribute('search-selector-data');

        //data attribute to be searched for by select search (if used)
        this.searchFilterDataTarget = this.getAttribute('search-filter-data');

        /*
         * Cached Expected Elements (Expected to exist inside this component)
         */
        this.searchInputElement = this.querySelector(this.SEARCH_INPUT);
        this.clearInputBtnElement = this.querySelector(this.CLEAR_INPUT);
        this.searchSelectElement = this.querySelector(this.SELECT_INPUT);
        this.searchFilterElements = Array.from(this.querySelectorAll(this.FILTER_TOGGLE));
        this.clearFiltersBtnElement = this.querySelector(this.CLEAR_FILTERS);
        //this.resetSearchBtnElement = this.querySelector(this.RESET_SEARCH);

        /*
         * Set flags based on what expected input elements were found
         */
        this.hasSearchInput = !!this.searchInputElement;
        this.hasSearchSelect = !!this.searchSelectElement;
        this.hasFilters = this.searchFilterElements.length > 0;

        /*
         * Cached Provided Support Elements (provided by component attributes)
         */
        this.summaryTextElement = document.querySelector(this.summaryTextSelector);
        this.noResultsElement = document.querySelector(this.noResultsSelector);
        this.searchContainerElement = document.querySelector(this.searchContainerSelector);

        /*
         * Setup Listeners based on input flags
         */

        /* TEXT SEARCH */
        if (this.hasSearchInput) {
            this.searchInputElement.addEventListener('input', () => {
                this.executeSearch();
            });

            if (this.clearInputBtnElement) {
                this.clearInputBtnElement.addEventListener('click', () => {
                    this.clearSearchInput();
                });
            }
        }

        /* SELECT DROPDOWN */
        if (this.hasSearchSelect) {
            this.searchSelectElement.addEventListener('change', () => {
                this.executeSearch();
            });
        }

        /* FILTER CLOUD */
        if (this.hasFilters) {
            this.searchFilterElements.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    this.updateActiveFilters();
                    this.executeSearch();
                });
            });

            if (this.clearFiltersBtnElement) {
                this.clearFiltersBtnElement.addEventListener('click', () => {
                    this.clearAllFilters();
                });
            }
        }

        /* NO RESULTS SETUP */
        //hide the no results element by default
        if (this.noResultsElement) {}
            this.noResultsElement.style.display = 'none';

        //run an initial search in case fields contain default values on load
        //this.executeSearch();
    }

    /*================
     * TEXT SEARCH METHODS
     =================*/
    clearSearchInput() {
        this.searchInputElement.value = '';
        this.executeSearch();
    }

    /*================
     * FILTER CLOUD METHODS
     =================*/
    updateActiveFilters() {
        //empty filter array to hold new search filter strings
        this.activeFilters = [];

        if (this.hasFilters) {
            //build array of active filter strings - lowercase and trim whitespace
            this.searchFilterElements.forEach(toggle => {
                if (toggle.classList.contains(this.ACTIVE_CLASS) && toggle.hasAttribute(this.DATA_FILTER_FOR)) {
                    this.activeFilters.push(toggle.dataset.filterFor.toLowerCase().trim());
                }
            });
        }
    }

    clearAllFilters() {
        if (this.hasFilters) {
            //remove 'active' class from all filters
            this.searchFilterElements.forEach(toggle => {
                toggle.classList.remove(this.ACTIVE_CLASS);
            });
        }

        //update filters
        this.updateActiveFilters();

        //execute the search again using the blank filter array
        this.executeSearch();
    }

    /*================
     * MAIN SEARCH METHODS
     *  for the code is dark and the types are full of terrors
     =================*/
     executeSearch() {
        //get current values from search input field and select dropdown if they are used
        const searchText = this.hasSearchInput ? this.searchInputElement.value.toLowerCase().trim() : '';
        const currentSelection = this.hasSearchSelect ? this.searchSelectElement.value.toLowerCase().trim() : this.ALL_KEYWORD;

        //get target search container or fallback to searching within this component
        const targetContainer = this.searchContainerElement || this;
        const searchItems = Array.from(targetContainer.querySelectorAll(this.SEARCH_ITEM));

        //reset results counter
        this.resultsCount = 0;

        //iterate through all search items found and look for matches
        searchItems.forEach(item => {
            /* --- TEXT SEARCH --- */
            const searchTextElement = item.querySelector(this.SEARCH_TEXT);
            const itemName = searchTextElement ? searchTextElement.textContent.toLowerCase().trim() : item.textContent;
            const hasInputMatch = !this.hasSearchInput || searchText === '' || itemName.includes(searchText);

            /* --- SELECT DROPDOWN SEARCH --- */
            const itemSelectDataAttribute = this.searchSelectorDataTarget ? item.getAttribute(this.searchSelectorDataTarget) : null;
            const itemSelection = itemSelectDataAttribute ? itemSelectDataAttribute.toLowerCase().trim() : '';
            const hasSelectMatch = !this.hasSearchSelect || currentSelection === this.ALL_KEYWORD || itemSelection.includes(currentSelection);

            /* --- FILTER TOGGLES SEARCH --- */
            const itemTagDataAttribute = this.searchFilterDataTarget ? item.getAttribute(this.searchFilterDataTarget) : null;
            const itemTags = itemTagDataAttribute ? itemTagDataAttribute.split(",").map(tag => tag.toLowerCase().trim()) : [];
            const hasTagMatch = !this.hasFilters || this.activeFilters.length === 0 || this.activeFilters.some(tag => itemTags.includes(tag));

            /* --- ITEM MATCH DISPLAY --- */
            if (hasInputMatch && hasSelectMatch && hasTagMatch) {
                item.style.display = '';
                item.classList.remove(this.HIDDEN_CLASS);
                this.resultsCount++;
            } else {
                item.style.display = 'none';
                item.classList.add(this.HIDDEN_CLASS);
            }
        });

        // UI Updates
        this.resultsFeedbackCheck();
        this.updateSummaryText();
     }

     resetSearch() {
        
     }

    /*================
     * UI METHODS
     =================*/
     resultsFeedbackCheck() {
        if (this.noResultsElement) {
            if (this.resultsCount === 0) {
                this.noResultsElement.style.display = '';
            } else {
                this.noResultsElement.style.display = 'none';
            }
        }
     }

     updateSummaryText() {

     }
});