customElements.define('advanced-search', class extends HTMLElement { 
    constructor () {
        super();

        /* Selectors */
        this.SEARCH_INPUT = '[data-search-input]';
        this.CLEAR_INPUT = '[data-clear-input]';
        this.FILTER_TOGGLE = '[data-search-filter]';
        this.CLEAR_ALL_FILTERS = '[data-clear-all-filters]';
        this.CLEAR_FILTERS_GROUP = '[data-clear-group-filters]';
        this.RESET_SEARCH = '[data-search-reset]';

        /* Constants */
        this.debounceTime = 500; //debounce for 500 ms

        //raw search list after modifying to add id
        this.searchDocs = []; 

        //results list
        this.results = [];

        /* Active Filters */
        this.activeFilters = {
            type: [],
            regions: [],
            themes: [],
            search_species: [],
            subtopics: []
        };

        //pagination
        this.totalPages = 1;
        this.currentPage = 1;

        /* Flags */
        this.hasSearchInput = false;
        this.hasFilters = false;
    }

    connectedCallback() {
        //initialize minisearch with our options
        this.miniSearch = new window.MiniSearch({
            fields: ['title', 'description'], //fields to search/index for text input
            storeFields: ['title', 'type', 'description', 'date', 'url', 'region', 'theme', 'search_species', 'subtopics'], //fields to return (we include the tag categories because we need to use them in filter during searches)
            searchOptions: {
                boost: { title: 2 },    // boost title for matching
                prefix: true,           // matches terms that start with the query
                prefixLength: 3,        // first 3 characters must be exact
                fuzzy: 0.2                // enable fuzzy matching
            }
        });

        //setup this component
        this.setupComponent();
    }

    /* 
        SETUP METHODS
    */
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

        //results template selector attribute
        this.resultTemplateSelector = this.getAttribute('result-template');

        //no results selector attribute
        this.noResultsSelector = this.getAttribute('no-results');

        //get results per page for pagination attribute - parse it as an int and set it to base-10
        this.resultsPerPage = parseInt(this.getAttribute('results-per-page'), 10);

        //page index summary attribute
        this.pageIndexSummarySelector = this.getAttribute('page-summary');

        //page results summary attribute
        this.pageResultSummarySelector = this.getAttribute('results-summary');

        //page controls (next/prev btns container)
        this.pageControlsSelector = this.getAttribute('page-controls');

        //page progress bar attribute
        this.pageProgressSelector = this.getAttribute('pagination-progress');

        /*
         *  Cached Expected Elements (Expected to exist inside this component)
         */

        //script holding raw json text string for search
        this.searchIndexElement = document.querySelector(this.searchDataSelector);

        if (!this.searchIndexElement) {
            console.warn(`advanced-search: Could not find script element with ID "${this.searchDataSelector}".`);
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
                this.initializeSearch(this.searchDocs);

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
        this.clearToggleGroupElements = Array.from(this.querySelectorAll(this.CLEAR_FILTERS_GROUP));

        //hide the clear toggle group buttons by default
        this.clearToggleGroupElements.forEach(clearBtn => { 
            clearBtn.classList.add("hide");
        });
        
        //clear all toggles btn
        this.clearAllTogglesBtnElement = this.querySelector(this.CLEAR_ALL_FILTERS);

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

        //hide no results element by default
        this.noResultsElement.style.display = "none";

        //page summary elements
        this.pageIndexSummaryText = document.querySelector(this.pageIndexSummarySelector);
        this.pageResultSummaryText = document.querySelector(this.pageResultSummarySelector);

        //prev/next page btns
        this.pageNextBtn = document.querySelector(`${this.pageControlsSelector} [data-page-next]`);
        this.pagePreviousBtn = document.querySelector(`${this.pageControlsSelector} [data-page-previous]`);

        //progress bar
        this.pageProgressBar = document.querySelector(this.pageProgressSelector);

        //setup listeners
        this.setupListeners();
    }

    setupListeners() {
        /*
         * Setup Listeners based on input flags
         */

        //handle enter key on form
        this.querySelector('form').addEventListener('keydown', (e) => {
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
        MINISEARCH / SEARCH JS METHODS
    */
    initializeSearch(searchDocuments) {
        //console.log("Component started with search docs:", this.searchDocs);

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
            //skip minisearch and just match tags
            this.results = this.searchDocs.filter(item => {
                return this.checkResultAgainstActiveFilters(item);
            });
        } else {
            //use minisearch + match tags
            this.results = this.miniSearch.search(query, {
                //use the filter option to match tags, check each result for tag matches
                //each 'result' is an object with all its key/values from searchDocs
                filter: (result) => {
                    return this.checkResultAgainstActiveFilters(result);
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

    checkResultAgainstActiveFilters(result) {
        //go through each entry in activeFilters object - destructure each as 'category' and 'tags'
        return Object.entries(this.activeFilters).every(([category, activeTags]) => {
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
            
            //toggle the clear toggle
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
        //clear any html in the search container
        this.searchContainerElement.innerHTML = '';

        //page document fragment
        const pageFragment = new DocumentFragment();

        //loop through results and render them using a template
        results.forEach(result => {
            //clone template contents
            const resultCard = this.resultTemplateElement.content.cloneNode(true);

            //save a normalized version of type
            const itemType = result.type.toLowerCase().trim();

            //set card class type for styling
            resultCard.querySelector("[data-serach-item]").classList.add(itemType);

            //set title and title href
            const titleElement = resultCard.querySelector("[data-item-title]");
            titleElement.textContent = result.title;
            titleElement.href = result.url;

            //set type text
            resultCard.querySelector("[data-item-type]").textContent = result.type;

            //set type icon
            const iconElement = resultCard.querySelector("[data-item-icon]");
            const iconClasses = this.getResourceTypeIcon(itemType).split(",");

            //set icon classes on icon
            iconClasses.forEach(iconClass => { 
                iconElement.classList.add(iconClass);
            });

            //set date label
            //see: https://jordanbrennan.hashnode.dev/so-many-native-javascript-date-formats
            //see: https://codingnomads.com/formatting-dates-and-times-javascript-intl
            const [year, month, day] =  result.date.split("-");
            const usDate = new Date(`${month}-${day}-${year}`);
            const displayDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

            //set the data text
            resultCard.querySelector("[data-item-date]").textContent = displayDateFormatter.format(usDate);

            //set description text
            resultCard.querySelector("[data-item-description]").textContent = result.description;

            //set url href
            resultCard.querySelector("[data-item-link]").href = result.url;

            //append result card to page fragment
            pageFragment.appendChild(resultCard);
        });

        //append the page fragment to the search container
        this.searchContainerElement.appendChild(pageFragment);

        //update pagination controls
        this.updatePaginationControls();

        //update pagination UI
        this.updatePaginationSummary(startIndex, endIndex);
    }

    getResourceTypeIcon(type)
    {
        switch(type)
        {
            case "web-application":
                return "fa-solid,fa-globe";
                break;

            case "data-and-code":
                return "fa-solid,fa-database";
                break;

            case "publication":
                return "fa-solid,fa-newspaper";
                break;

            case "code-repo":
                return "fa-brands,fa-github";
                break;

            case "presentation":
                return "fa-solid,fa-person-chalkboard";
                break;

            default:
                return "fa-regular,fa-circle-question";
                break;
        }
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
        if (this.pageResultSummaryText)
            this.pageResultSummaryText.textContent = (resultsLength >= 1) ? `Showing (${startIndex + 1} - ${endIndex}) of (${resultsLength}) results` : "No Results";

        //Page X of Y
        if (this.pageIndexSummaryText)
            this.pageIndexSummaryText.textContent = (resultsLength >= 1) ? `Page ${this.currentPage} of ${this.totalPages}` : "";

        //pagination progress bar
        if (this.pageProgressBar) {
            const progressFill = this.pageProgressBar.querySelector(".progress-bar");
            const progress = Math.floor((resultsLength >= 1) ? (this.currentPage / this.totalPages) * 100 : 0);

            this.pageProgressBar.setAttribute("aria-valuenow", progress);
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
        this.clearSearchInput();
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
});