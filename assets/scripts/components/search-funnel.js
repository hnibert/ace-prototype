customElements.define('search-funnel', class extends HTMLElement { 
    constructor () {
        super();

        /* Selectors */
        this.SEARCH_INPUT = '[data-search-input]';
        this.CLEAR_INPUT = '[data-clear-input]';
        this.FILTER_TOGGLE = '[data-search-filter]';
        this.FILTER_TAB_BTN = '[data-search-tab]'; 
        this.SUBMIT_SEARCH = '[data-submit-search]';
        this.CLEAR_FILTERS_GROUP = '[data-clear-group-filters]';

        /* Active Filters */
        this.activeFilters = {
            type: [],
            regions: [],
            themes: [],
            search_species: [],
            subtopics: []
        };

        /* Flags */
        this.hasSearchInput = false;
        this.hasFilters = false;
    }

    connectedCallback() {
        this.setupComponent();
    }

    /* 
        SETUP METHODS
    */
    setupComponent() {
        //search input element
        this.searchInputElement = this.querySelector(this.SEARCH_INPUT);

        //clear search input btn
        this.clearInputBtnElement = this.querySelector(this.CLEAR_INPUT);

        //submit search btn
        this.submitSearchBtnElement = this.querySelector(this.SUBMIT_SEARCH);

        //toggle search btns (need to be checkbox toggles i.e type=checkbox)
        this.searchFilterElements = Array.from(this.querySelectorAll(this.FILTER_TOGGLE));

        //clear toggle category btns
        this.clearToggleGroupElements = Array.from(this.querySelectorAll(this.CLEAR_FILTERS_GROUP));

        //hide the clear toggle group buttons by default
        this.clearToggleGroupElements.forEach(clearBtn => { 
            clearBtn.classList.add("hide");
        });

        /*
         * Set flags based on what expected input elements were found
         */
        this.hasSearchInput = !!this.searchInputElement;
        this.hasFilters = this.searchFilterElements.length > 0;

        this.setupListeners();
    }

    setupListeners() {
        /*
         * Setup Listeners based on input flags
         */

        /* TEXT SEARCH */
        if (this.hasSearchInput) {
            //search text input with a debounce 
            //https://www.geeksforgeeks.org/javascript/debouncing-in-javascript/

            this.searchInputElement.addEventListener('input', () => {
                this.updateSubmitURL();
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
                toggle.addEventListener('click', (e) => {
                    this.updateActiveFilters(e);
                });
            });

            //clear filter category btns
            this.clearToggleGroupElements.forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    this.clearFilterCategory(e);
                });
            });
        }
    } 

    /*
        FILTER METHODS
    */
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

        console.log(this.activeFilters);

        //toggle the clear toggle
        this.toggleClearGroupButton(currentCategory.length, name);

        //update search query
        this.updateSubmitURL();
    }

    clearFilterCategory(e) {
        //get the name (category) from the clicked toggle
        const { name } = e.currentTarget;

        //get the category in active filters array by name given from the toggle btn name attrb
        const currentCategory = this.activeFilters[name];

        const categoryBtns = this.searchFilterElements.filter(toggle => {
            return toggle.name === name;
        });

        //set all toggles to unchecked
        categoryBtns.forEach(toggle => {
            toggle.classList.remove("active");
        });

        //clear the current category in active filters manually
        currentCategory.length = 0;

        //toggle clear category btn
        this.toggleClearGroupButton(currentCategory.length, name);

        //update search parameters url
        this.updateSubmitURL();
    }

    /*
        SEARCH INPUT METHODS
    */

    updateSubmitURL() {
        if (!this.submitSearchBtnElement)
            return;

        this.submitSearchBtnElement.href = this.buildURLEndpoint();
    }

    clearSearchInput() {
        this.searchInputElement.value = "";
        this.updateSubmitURL();
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

    /* 
        URL - SEARCH PARAMETER METHODS
    */    
    //see: https://gomakethings.com/articles/how-to-build-a-query-string-from-an-object-of-data-with-vanilla-js/
    buildURLQuery(data) {
        //don't add empty parameters to the url
        //see: https://stackoverflow.com/questions/62989310/how-to-remove-empty-query-params-using-urlsearchparams?rq=3
        let searchParameters = new URLSearchParams(data);
        let emptyNullKeys = [];

        //go through search param entries and check for emtpy values
        //value has to be before key...
        searchParameters.forEach((value, key) => {
            if (value === '') {
                console.log(value);
                emptyNullKeys.push(key);
            }
        });

        //go through empty keys and delete thems from search params
        emptyNullKeys.forEach(key => {
            searchParameters.delete(key);
        });

	    return searchParameters.toString();
    }

    buildURLEndpoint() {
        //get domain origin
        const domainOrigin = window.location.origin;

        //get subfolder
        const baseSubfolder = "/ace-prototype/";

        //normalize search query and current page number
        const query = this.searchInputElement.value.toLowerCase().trim();

        //build a new object containing all our search parameters together
        const finalParameterObject = {
            query, //get the search query
            ...this.activeFilters //clone active filters object ot here
        };

        //build a new url query with all the info it needs
        const newQueries = `${this.buildURLQuery(finalParameterObject)}`;

        //build the relative path
        const relativePath = `${baseSubfolder}resources/?${newQueries}`;

        //build the final endpoint
        const endpoint = new URL(relativePath, domainOrigin);

        //console.log(endpoint);

        return endpoint;
    }

    /* 
        UTIL METHODS
    */
    getClearToggleGroupBtn(groupName) {
        //return a button that has a name value that matches the group value, otherwise return null
        return this.clearToggleGroupElements.find(clearBtn => clearBtn.name === groupName) ?? null;
    }
});