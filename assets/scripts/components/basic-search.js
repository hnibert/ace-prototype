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
        this.SHOW_MORE = '[data-show-more]';

        //store active filters
        this.activeFilters = [];

        /* Flags */
        this.hasSearchInput = false;
        this.hasSearchSelect = false;
        this.hasFilters = false;
        this.hasPagination = false;

        // Counter tracking active matches
        this.resultsCount = 0;

        // Pagination tracking
        this.currentVisibleItems = 0;
    }

    connectedCallback() {
        this.setupComponent();
    }

    setupComponent() {
        /*
         * Get Provided Attributes
         */

        //supporting element selectors
        this.searchContainerSelector = this.getAttribute('search-container');
        this.summaryTextSelector = this.getAttribute('summary-text');
        this.paginateSummarySelector = this.getAttribute('paginate-summary')
        this.noResultsSelector = this.getAttribute('no-results');

        //data attribute to be searched for by filter search (if used)
        this.searchSelectorDataTarget = this.getAttribute('search-selector-data');

        //data attribute to be searched for by select search (if used)
        this.searchFilterDataTarget = this.getAttribute('search-filter-data');

        //data attribute for 'show more/less' pagination controls
        this.paginateControlSelector = this.getAttribute('paginate-controls');

        //data attribute for amount of items to show per pagination batch 
        this.resultsPerPage = parseInt(this.getAttribute('results-per-page'), 10);

        //set current visible items to given results per page or 0
        this.currentVisibleItems = this.resultsPerPage || 0;

        //get the reset search button selector
        this.resetSearchSelector = this.getAttribute('reset-search');

        /*
         * Cached Expected Elements (Expected to exist inside this component)
         */
        this.searchInputElement = this.querySelector(this.SEARCH_INPUT);
        this.clearInputBtnElement = this.querySelector(this.CLEAR_INPUT);
        this.searchSelectElement = this.querySelector(this.SELECT_INPUT);
        this.searchFilterElements = Array.from(this.querySelectorAll(this.FILTER_TOGGLE));
        this.clearFiltersBtnElement = this.querySelector(this.CLEAR_FILTERS);

        /*
         * Cached Provided Support Elements (provided by component attributes)
         */

        //get the results summary text
        this.summaryTextElement = document.querySelector(this.summaryTextSelector);
        this.paginateSummaryElement = document.querySelector(this.paginateSummarySelector);

        //get the no results container
        this.noResultsElement = document.querySelector(this.noResultsSelector);

        //get the search container
        this.searchContainerElement = document.querySelector(this.searchContainerSelector);

        //get the reset search button element
        this.resetSearchBtnElement = document.querySelector(this.resetSearchSelector);

        //get the paginate controls container and the show more btn
        this.paginateControls = document.querySelector(this.paginateControlSelector);

        if (this.paginateControls)
            this.showMoreBtnElement = this.paginateControls.querySelector(this.SHOW_MORE);

        /*
         * Set flags based on what expected input elements were found
         */
        this.hasSearchInput = !!this.searchInputElement;
        this.hasSearchSelect = !!this.searchSelectElement;
        this.hasFilters = this.searchFilterElements.length > 0;
        this.hasPagination = !!this.paginateControls;

        //setup listeners
        this.setupListeners();
    }

    setupListeners() {
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

        /* FILTER TOGGLES */
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
        if (this.noResultsElement)
            this.noResultsElement.style.display = 'none';

        /* RESET SEARCH SETUP */
        if (this.resetSearchBtnElement) {
            this.resetSearchBtnElement.addEventListener('click', () => {
                this.resetSearch();
            });
        }

        /* PAGINATION SETUP */
        if (this.hasPagination) {
            this.showMoreBtnElement.addEventListener('click', () => {
                this.currentVisibleItems += this.resultsPerPage;

                if (this.currentVisibleItems >= this.resultsCount)
                    this.currentVisibleItems = this.resultsCount;

                this.updatePagination();
            });
        }

        //run an initial search in case fields contain default values on load
        //TODO: add url parameter checks to set defaults
        this.executeSearch();
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

        //reset pagination visibility count
        this.currentVisibleItems = this.resultsPerPage;

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
        this.updatePagination();
     }

     resetSearch() {
        //clear search input
        this.searchInputElement.value = ''; 
        
        //clear all filters
        if (this.hasFilters) {
            //remove 'active' class from all filters
            this.searchFilterElements.forEach(toggle => {
                toggle.classList.remove(this.ACTIVE_CLASS);
            });
        }

        //update filters
        this.updateActiveFilters();
        
        //execute search
        this.executeSearch();
     }

    /*================
     * PAGINATION 'SHOW MORE' METHODS
     =================*/
     updatePagination() {
        if (!this.hasPagination)
            return;

        //get results that are not hidden by the actual search logic
        const searchItems = Array.from(this.searchContainerElement.querySelectorAll(`${this.SEARCH_ITEM}:not(.${this.HIDDEN_CLASS})`));

        //go through 'visible' search items and hide/show them based on index being less than current visible items
        searchItems.forEach((item, index) => {
            if (index < this.currentVisibleItems) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        //hide the show more button if there are no results or we are showing all results
        if (this.resultsCount === 0 || this.currentVisibleItems === this.resultsCount || this.resultsCount < this.resultsPerPage) {
            this.paginateControls.classList.add('hide');
            this.showMoreBtnElement.disabled = true;
        } else {
            this.paginateControls.classList.remove('hide');
            this.showMoreBtnElement.disabled = false;            
        }

        //update summary text
        this.updateSummaryText();
     }

     showAllResults() {

     }
     
    /*================
     * UI METHODS
     =================*/
     resultsFeedbackCheck() {
        if (!this.noResultsElement)
            return;

        if (this.resultsCount === 0) {
            this.noResultsElement.style.display = '';

            if (this.hasPagination) {
                this.paginateControls.classList.add('hide');
                this.showMoreBtnElement.disabled = true;
            }
        } else {
            this.noResultsElement.style.display = 'none';

            if (this.hasPagination) {
                this.paginateControls.classList.remove('hide');
                this.showMoreBtnElement.disabled = false;
            }
        }
     }

     updateSummaryText() {
        if (!this.summaryTextElement)
            return;

        if (this.resultsCount === 0) {
            this.summaryTextElement.textContent = 'No Results';

            if (this.hasPagination)
                this.updatePaginationSummary();

            return;
        }

        if (this.hasPagination) {
            const minVisible = this.currentVisibleItems - this.currentVisibleItems + 1;
            const maxVisible = (this.currentVisibleItems > this.resultsCount) ? this.resultsCount : this.currentVisibleItems;

            //Showing (X - Y) of (Z) results
            this.summaryTextElement.textContent = `Showing (${minVisible} - ${maxVisible}) of (${this.resultsCount}) results`;

            this.updatePaginationSummary();
        } else {
            //Showing X results
            this.summaryTextElement.textContent = `Showing ${this.resultsCount} Results`;
        }
     }

     updatePaginationSummary() {
        if (!this.paginateSummaryElement) 
            return;

        //if there are no results set to empty
        if (this.resultsCount === 0) {
            this.paginateSummaryElement.textContent = '';
            return;
        }

        //get items remaining visible
        const itemsRemaining = this.resultsCount - this.currentVisibleItems; 

        //check pluralize item(s)
        const itemPlural = (itemsRemaining > 1) ? "items" : "item";

        //set items remaining summary text
        if (itemsRemaining > 0) {
            this.paginateSummaryElement.textContent = `(${itemsRemaining}) ${itemPlural} remaining`;
        } else {
            this.paginateSummaryElement.textContent = '';
        }
     }
});