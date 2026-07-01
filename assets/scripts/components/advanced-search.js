customElements.define('advanced-search', class extends HTMLElement { 
    constructor () {
        super();

        /* Selectors */
        this.SEARCH_INPUT = '[data-search-input]';
        this.CLEAR_INPUT = '[data-clear-input]';
        
        this.FILTER_TOGGLE = '[data-search-filter]';
        this.DATA_SEARCH_CATEGORY = '[data-search-category]';
        this.CLEAR_ALL_FILTERS = '[data-clear-all-filters]';

        this.RESET_SEARCH = '[data-search-reset]';

        /* Flags */
        this.hasSearchInput = false;
        this.hasFilters = false;
    }

    connectedCallback() {
        /* Setup MiniSearch JS */


        //setup this component
        this.setupComponent();
    }

    setupComponent() {
        /* 
         *  Get Provided Attributes 
         */
        
        //supporting element selectors
        this.searchContainerSelector = this.getAttribute('search-container');
        this.resultTemplateSelector = this.getAttribute('result-template');
        this.summaryTextSelector = this.getAttribute('summary-text');
        this.noResultsSelector = this.getAttribute('no-results');

        /*
         *  Cached Expected Elements (Expected to exist inside this component)
         */

        //search input element
        this.searchInputElement = this.querySelector(this.SEARCH_INPUT);

        //clear search input btn
        this.clearInputBtnElement = this.querySelector(this.CLEAR_INPUT);

        //toggle search btns (need to be checkbox toggles i.e type=checkbox)
        this.searchFilterElements = Array.from(this.querySelectorAll(this.FILTER_TOGGLE));

        //clear toggle category btns
        //...

        //clear all toggles btn
        this.clearAllTogglesBtnElement = this.querySelector(this.CLEAR_FILTERS);

        /*
         * Set flags based on what expected input elements were found
         */
        this.hasSearchInput = !!this.searchInputElement;
        this.hasFilters = this.searchFilterElements.length > 0;

        /*
         * Cached Provided Support Elements (provided by component attributes)
         */

        //the container to build inside of
        this.searchContainerElement = document.querySelector(this.searchContainerSelector);

        //result template element
        this.resultTemplateElement= document.querySelector(this.resultTemplateSelector);

        //search summary text i.e "{X} Results Found For '{input}' under '{categoryFilters}'"
        this.summaryTextElement = document.querySelector(this.summaryTextSelector);

        //no results feedback
        this.noResultsElement = document.querySelector(this.noResultsSelector);

        /*
         * Setup Listeners based on input flags
         */

        /* TEXT SEARCH */
        if (this.hasSearchInput) {
            //search text input
            this.searchInputElement.addEventListener('input', () => {
                this.executeSearch();
            });

            //clear search input btn
            if (this.clearInputBtnElement) {
                this.clearInputBtnElement.addEventListener('click', () => {
                    this.clearSearchInput();
                });
            }
        }

        /* FILTER TOGGLES */
        if (this.hasFilters) {
            //filter toggle btns
            this.searchFilterElements.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    this.updateActiveFilters();
                    this.executeSearch();
                });
            });

            //clear filter category btns
            //...

            //clear all filters
            if (this.clearFiltersBtnElement) {
                this.clearFiltersBtnElement.addEventListener('click', () => {
                    this.clearAllFilters();
                });
            }
        }
    }
});