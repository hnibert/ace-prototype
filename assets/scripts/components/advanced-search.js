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

        /* raw search list after modifying to add id */
        this.searchDocs = []; 

        /* Flags */
        this.hasSearchInput = false;
        this.hasFilters = false;
    }

    connectedCallback() {
        //setup this component
        this.setupComponent();
    }

    setupComponent() {
        /* 
         *  Get Provided Attributes 
         */
        
        //supporting element selectors
        this.searchDataSelector = this.getAttribute('search-data');

        //warn if search data is null or it wasn't defined
        if (!this.searchDataSelector) {
            console.warn('advanced-search: Missing "search-data" attribute!');
            return;
        }

        //search container attribute
        this.searchContainerSelector = this.getAttribute('search-container');

        //results template selector
        this.resultTemplateSelector = this.getAttribute('result-template');

        //no results selector
        this.noResultsSelector = this.getAttribute('no-results');

        /*
         *  Cached Expected Elements (Expected to exist inside this component)
         */

        //script holding raw json text string for search
        this.searchIndexElement = document.querySelector(this.searchDataSelector);

        if (!this.searchIndexElement) {
            console.warn(`advanced-search: Could not find script element with ID "${this.searchDataSelector}".`);
            return;            
        } else {
            try {
                //parse the given raw string into a js object array
                const parsedJSON = JSON.parse(this.searchIndexElement.textContent);

                //add an id key to each entry in parsedJSON
                this.searchDocs = parsedJSON.map((item, index) => ({
                    ...item, 
                    id: index
                }));


                //setup minisearch.js with our searchDocs array
                this.initializeSearch();

            } catch(error) {
                console.error('advanced-search: Failed to parse JSON data.', error);
            }
        }

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

    initializeSearch() {
        console.log("Component initialized with static docs:", this.searchDocs);
    }
});