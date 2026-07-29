//Based off of Refined Guides: Price range slider tutorial
//https://github.com/refinedguides/range-slider
//https://www.youtube.com/watch?v=X9ooIi9A4A8

customElements.define('range-slider', class extends HTMLElement { 
    constructor () {
        super();

        //get unit label (default) attribute (if any)
        this.unitDefaultLabel = this.getAttribute('unit-default-label') || '';

        //get unit label (plural) attribute (if any)
        this.unitPluralLabel = this.getAttribute('unit-plural-label') || `${this.unitDefaultLabel}s`;

        //get unit label (max) attribute (if any)
        this.unitMaxLabel = this.getAttribute('unit-max-label') || 'all';

        //is user dragging the fill/slider?
        this.isDragging = false;

        //drag start offset
        this.startDragOffsetX = 0;

        //max range this range slider can have
        this.maxRange = 0;

        //last min-max values that were emitted in the custom change event
        this.lastEmittedValues = { min: 0, max: 0 };

        //accepted keyboard keys
        this.acceptedKeys = ["Enter", "Backspace", "ArrowUp", "ArrowDown", "Delete", "Space"];

        //check for given min/max value attributes
        this.maximumValue = this.getAttribute('max') || null;
        this.minimumValue = this.getAttribute('min') || null;
    }

    connectedCallback() {
        this.setupComponent();
    }

    disconnectedCallback() {
        this.clearListeners();
    }

    clearListeners() {
        //cleanup document event listeners (prevents memory leaks)
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }

    setupComponent() {
        //get the slider element
        this.sliderElement = this.querySelector('.range .slider');

        //get the fill element
        this.fillElement = this.sliderElement.querySelector('.fill');

        //get the min range number input
        this.minNumInputElement = this.querySelector("input[type='number'].min-range");

        //get the max range number input
        this.maxNumInputElement = this.querySelector("input[type='number'].max-range");

        //get the min range thumb input
        this.minRangeInputElement = this.querySelector(".range input[type='range'].min-input");

        //get the max range thumb input
        this.maxRangeInputElement = this.querySelector(".range input[type='range'].max-input");

        //get the range output element
        this.rangeOutputElement = this.querySelector(".range-output");

        //set min max to all input elements
        this.setupMinMaxValues();

        //setup listeners
        this.setupListeners();
    }

    setupMinMaxValues() {
        /*
            Set Min/Max ranges for all inputs
            NOTE: can be done with liquid/manually but this ensures they're all the same
        */
        if (this.maximumValue !== null && this.maxValue !== null ) {
            if (this.minNumInputElement) {
                this.minNumInputElement.min = this.minimumValue;
                this.minNumInputElement.max = this.maximumValue;
            }

            if (this.maxNumInputElement) {
                this.maxNumInputElement.min = this.minimumValue;
                this.maxNumInputElement.max = this.maximumValue;
            }

            if (this.minRangeInputElement) {
                this.minRangeInputElement.min = this.minimumValue;
                this.minRangeInputElement.max = this.maximumValue;
            }

            if (this.maxRangeInputElement) {
                this.maxRangeInputElement.min = this.minimumValue;
                this.maxRangeInputElement.max = this.maximumValue;
            }

            //set default min/max values to last emitted values
            this.lastEmittedValues.min = this.minimumValue;
            this.lastEmittedValues.max = this.maxValue;

            //get max range of the slider 
            this.maxRange = parseInt(this.minimumValue) - parseInt(this.maximumValue);
        }        
    }

    setupListeners() {
        //clear any listeners (in-case of re-connects)
        this.clearListeners();

        /* 
            NUMBER INPUT LISTENERS
        */

        //min input number element
        this.minNumInputElement.addEventListener('input', (e)=> {
            this.updateRange(e);
        });

        /*
        //handle keyboard input for number inputs, only looking for numerics, and other keys relevant to number inputs
        this.minNumInputElement.addEventListener('keyup', (e) => {
            //see: https://www.linkedin.com/pulse/mastering-javascript-key-events-enhanced-user-interaction-akezc/
            //see: https://stackoverflow.com/questions/2257070/detect-numbers-or-letters-with-jquery-javascript

            if (e.key.match(/[0-9]/) || this.acceptedKeys.includes(e.key)) {
                this.emitChangeEvent();
            }
        });
        */

        //max input number element
        this.maxNumInputElement.addEventListener('input', (e)=> {
            this.updateRange(e);
        });

        /*
        //handle keyboard input for number inputs, only looking for numerics, and other keys relevant to number inputs
        this.maxNumInputElement.addEventListener('keyup', (e) => {
            //see: https://www.linkedin.com/pulse/mastering-javascript-key-events-enhanced-user-interaction-akezc/
            //see: https://stackoverflow.com/questions/2257070/detect-numbers-or-letters-with-jquery-javascript

            if (e.key.match(/[0-9]/) || this.acceptedKeys.includes(e.key)) {
                this.emitChangeEvent();
            }
        });
        */

        /* 
            RANGE INPUT LISTENERS
        */

        //min input range element
        this.minRangeInputElement.addEventListener('input', () => {
            if (parseInt(this.minRangeInputElement.value) >= parseInt(this.maxRangeInputElement.value)) {
                this.maxRangeInputElement.value = this.minRangeInputElement.value;
            }

            //update the fill element
            this.updateFill();
        });

        //max input range element
        this.maxRangeInputElement.addEventListener('input', () => {
            if (parseInt(this.maxRangeInputElement.value) <= parseInt(this.minRangeInputElement.value)) {
                this.minRangeInputElement.value = this.maxRangeInputElement.value;
            }

            //update the fill element
            this.updateFill();
        });

        /* 
            FILL SLIDER LISTENERS
        */

        //fill element mouse down to start slider dragging
        this.fillElement.addEventListener('mousedown', (e) => {
            this.startSliderDrag(e);
        });

        //declare these event here so they can be cleaned-up later in disconnectedCallback
        this.handleMouseMove = (e) => this.updateSliderDrag(e);
        this.handleMouseUp = () => this.endSliderDrag();

        //document mouse move for slider dragging
        document.addEventListener('mousemove', this.handleMouseMove);

        //document mouse up to end slider dragging
        document.addEventListener('mouseup', this.handleMouseUp);

        //update the fill by default 
        this.updateFill();
    }

    /*================
     * DRAG & SLIDE METHODS
     =================*/
    startSliderDrag(e) {
        //prevent text highlights while dragging
        e.preventDefault(); 

        //set is dragging to true
        this.isDragging = true;

        //get mouse position relative to fill
        this.startDragOffsetX = e.clientX - this.fillElement.getBoundingClientRect().left;

        //toggle dragging class on this component
        this.classList.toggle('dragging', this.isDragging);
    }

    updateSliderDrag(e) {
        if (this.isDragging) {
            //get size and position of slider element
            const sliderRect = this.sliderElement.getBoundingClientRect();
            
            //get width of the fill element
            const fillWidth = parseFloat(this.fillElement.style.width || 0);

            //calculate new left position relative to slider width
            let newLeft = ((e.clientX - sliderRect.left - this.startDragOffsetX) / sliderRect.width) * 100;

            //ensure fill doesn't exceed slider boundaries
            newLeft = Math.min(Math.max(newLeft, 0), 100 - fillWidth);

            //update fill 'left' position with new value
            this.fillElement.style.left = `${newLeft}%`;

            //calculate new min & max range input positions
            const inputRange = this.maxRangeInputElement.max - this.minRangeInputElement.min;
            const newMin = Math.round((newLeft / 100) * inputRange) + parseInt(this.minRangeInputElement.min);
            const newMax = newMin + parseInt(this.maxRangeInputElement.value) - parseInt(this.minRangeInputElement.value);

            //update new min & max range input values
            this.minRangeInputElement.value = newMin;
            this.maxRangeInputElement.value = newMax;

            //update the fill by default 
            this.updateFill();
        }     

        //toggle dragging class on this component
        this.classList.toggle('dragging', this.isDragging);   
    }

    endSliderDrag() {
        if (this.isDragging) {
            //set is dragging to false
            this.isDragging = false;

            //emit change event with latest min/max values
            this.emitChangeEvent();
        }

        //toggle dragging class on this component
        this.classList.toggle('dragging', this.isDragging);
    }


    /*================
     * RANGE METHODS
     =================*/
    updateFill() {
        //get current min and max values from the corresponding range inputs
        const minValue = parseInt(this.minRangeInputElement.value);
        const maxValue = parseInt(this.maxRangeInputElement.value);

        //get total range of the slider (the max value of the max input element - the min value of the min input element)
        const totalRange = this.maxRangeInputElement.max - this.minRangeInputElement.min;

        //get the selected value range of the fill
        const valueRange = maxValue - minValue;

        //calculate width of the fill
        const fillWidth = Math.floor((valueRange / totalRange) * 100);

        //calculate the min thumb offset (how far left the fill needs to start from)
        const leftOffset = Math.floor(((minValue - this.minRangeInputElement.min) / totalRange) * 100);

        //update fill elements width
        this.fillElement.style.width = `${fillWidth}%`;

        //update fill elements left offset
        this.fillElement.style.left = `${leftOffset}%`;

        //update number inputs
        this.minNumInputElement.value = minValue;
        this.maxNumInputElement.value = maxValue;
        
        //emit change event with latest min/max values
        this.emitChangeEvent();

        //update output text
        this.updateOutputText(valueRange);
    }

    updateRange(e) {
        //get which number input this event came from
        const inputElement = e.target;

        //get current min and max values from the corresponding number inputs
        let minValue = parseInt(this.minNumInputElement.value);
        let maxValue = parseInt(this.maxNumInputElement.value);

        //ensure values don't cross each other in eitehr direction using number inputs
        if (inputElement === this.minNumInputElement && minValue > maxValue) {
            //cap max value to min
            maxValue = minValue;

            //update the related range input value
            this.maxNumInputElement.value = maxValue;
        } else if (inputElement === this.maxNumInputElement && maxValue < minValue) {
            //cap min value to max
            minValue = maxValue;

            //update the related range input value
            this.minNumInputElement.value = minValue;
        }

        //assign values to corresponding range inputs
        this.minRangeInputElement.value = minValue;
        this.maxRangeInputElement.value = maxValue;
        
        //update fill
        this.updateFill();
    }

    getNumberInputRangeValues() {
        return { min: parseInt(this.minNumInputElement.value), max: parseInt(this.maxNumInputElement.value) };
    }

    /*================
     * UI METHODS
     =================*/
    updateOutputText(number) {
        //generate the output text, if the given number is equal to the max range - use the max label - otherwise just handle setting the default or plural label instead
        const outputText = (parseInt(number) === this.maxRange) ? this.unitMaxLabel : `${number += 1} ${((number) > 1) ? this.unitPluralLabel : this.unitDefaultLabel }`;

        //update output text
        this.rangeOutputElement.textContent = outputText;
    }

    /*================
     * CUSTOM EVENT METHODS
       See: https://gomakethings.com/articles/custom-events-in-web-components/
     =================*/
    emitEvent(type, eventDetails = {}) {
        const event = new CustomEvent(`range-slider:${type}`, {
            bubbles: true,
            cancellable: false,
            detail: {
                //add an id field
                id: this.id || this.getAttribute('name') || null,

                //copy over details from the given event details object
                ...eventDetails
            }
        } );
        
        return this.dispatchEvent(event);
    }

    emitChangeEvent() {
        if (!this.lastEmittedValues)
            return;

        //get current min and max values from the number inputs
        const rangeValues = this.getNumberInputRangeValues();

        //check for changes to values
        if (this.lastEmittedValues.min !== rangeValues.min || this.lastEmittedValues.max !== rangeValues.max) {
            //save the new values to last emitted
            this.lastEmittedValues.min = rangeValues.min;
            this.lastEmittedValues.max = rangeValues.max;

            //emit change event with latest min/max values
            this.emitEvent('change', {
                min: rangeValues.min, 
                max: rangeValues.max
            });
        }
    }
});