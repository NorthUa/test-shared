(function () {
    'use strict';

    /**
     * compareInputValue: used if there are two field that should be equal (password and confirm password)
     * fieldType: input, textarea or password
     * formObject: object of HTML form
     * hideCounter: should be counter of remaining symbols for the field visible or not
     * inputId: string that should be assigned to id attribute
     * inputModelOptions: custom options for ng-model-options
     * inputName: name attribute of an input
     * inputValue: data model
     * itemBlurCallback: callback for onBlur event
     * itemFocusCallback: callback for onFocus event
     * isDataRevert: should incorrect value be immediately replaced by a previous correct one
     * isDisabled: is input should be disabled
     * isFocused: should input be focused when screen is displayed
     * onlyValidCharacters: allow only that characters which passed regex pattern
     * placeholderText: text that is displayed when input is empty
     * spellcheck: disable spell check for some field, for example input for base64 string
     * updateDataCallback: triggered when input was changed by a user, added whn two-way binding was replased with one-way
     * updateDataField: field name for updateDataCallback
     * validationIsRequired: input can't be empty
     * validationMaxLength: value should be shorter or equal this value
     * validationPattern: validation with regex
     */
	 
	var validatingInput = angular.module('igzValidatingInputField', []);

    validatingInput.component('igzValidatingInputField', {
            bindings: {
                compareInputValue: '<?',
                enterCallback: '<?',
                fieldType: '@',
                formObject: '<',
                hideCounter: '@?',
                inputIcon: '@',
                inputModelOptions: '<?',
                inputName: '@',
                inputValue: '<',
                isDisabled: '<?',
                isDataRevert: '@?',
                isFocused: '@?',
                itemBlurCallback: '&?',
                itemFocusCallback: '&?',
                onBlur: '&?',
                onlyValidCharacters: '@?',
                placeholderText: '@',
                spellcheck: '@?',
                updateDataCallback: '&?',
                updateDataField: '@?',
                validationIsRequired: '@',
                validationMaxLength: '@',
                validationPattern: '<',
                isClearIcon: '<?'
            },
            templateUrl: 'testShared/validating-input-field.tpl.html',
            controller: IgzValidatingInputFieldController
        });

    function IgzValidatingInputFieldController($element, $timeout, lodash, EventHelperService, FormValidationService) {
        var ctrl = this;

        var defaultInputModelOptions = {
            updateOn: 'default blur',
            debounce: {
                'default': 1000,
                'blur': 0
            }
        };

        ctrl.data = '';
        ctrl.inputFocused = false;
        ctrl.startValue = '';

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$postLink = postLink;

        ctrl.getRemainingSymbolsCounter = getRemainingSymbolsCounter;
        ctrl.isFieldInvalid = isFieldInvalid;
        ctrl.isCounterVisible = isCounterVisible;
        ctrl.focusInput = focusInput;
        ctrl.keyDown = keyDown;
        ctrl.unfocusInput = unfocusInput;
        ctrl.updateInputValue = updateInputValue;
        ctrl.clearInputField = clearInputField;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (!lodash.isNil(ctrl.disabled)) {
                ctrl.disableField = ctrl.disabled;
            }

            ctrl.inputModelOptions = lodash.defaultsDeep(ctrl.inputModelOptions || {}, defaultInputModelOptions);

            ctrl.inputFocused = ctrl.isFocused === 'true';
            ctrl.spellcheck = ctrl.spellcheck || 'true';

            ctrl.data = ctrl.inputValue;
            ctrl.startValue = angular.copy(ctrl.inputValue);
        }

        /**
         * Method called after initialization
         */
        function postLink() {
            if (ctrl.isFocused === 'true') {
                $timeout(function () {
                    $element.find('.field')[0].focus();
                });
            }
        }

        /**
         * onChange hook
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.inputValue)) {
                if (!changes.inputValue.isFirstChange()) {
                    ctrl.data = angular.copy(changes.inputValue.currentValue);
                    ctrl.startValue = angular.copy(ctrl.inputValue);
                }
            }
        }

        //
        // Public methods
        //

        /**
         * Get counter of the remaining symbols for the field
         * @returns {number}
         */
        function getRemainingSymbolsCounter() {
            if (ctrl.formObject) {
                var maxLength = parseInt(ctrl.validationMaxLength);
                var inputViewValue = ctrl.formObject[ctrl.inputName].$viewValue;

                return (maxLength >= 0 && inputViewValue) ? (maxLength - inputViewValue.length).toString() : null;
            }
        }

        /**
         * Check whether the field is invalid.
         * Do not validate field if onlyValidCharacters parameter was passed.
         * @returns {boolean}
         */
        function isFieldInvalid() {
            return !ctrl.onlyValidCharacters ? FormValidationService.isShowFieldInvalidState(ctrl.formObject, ctrl.inputName) : false;
        }

        /**
         * Check whether the counter should be visible
         * @returns {boolean}
         */
        function isCounterVisible() {
            return lodash.isNil(ctrl.hideCounter) || ctrl.hideCounter === 'false' ? true : false;
        }

        /**
         * Method to make input unfocused
         */
        function focusInput() {
            ctrl.inputFocused = true;
            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemFocusCallback();
            }
        }

        /**
         * Method which have been called from 'keyDown' event
         * @param {Object} event - native event object
         */
        function keyDown(event) {
            if (angular.isDefined(ctrl.enterCallback) && event.keyCode === EventHelperService.ENTER) {
                $timeout(ctrl.enterCallback);
            }
        }

        /**
         * Method to make input unfocused
         */
        function unfocusInput() {
            ctrl.inputFocused = false;

            // If 'data revert' option is enabled - set or revert outer model value
            setOrRevertInputValue();
        }

        /**
         * Updates outer model value on inner model value change
         * Used for `ng-change` directive
         */
        function updateInputValue() {
            if (angular.isDefined(ctrl.data)) {
                ctrl.inputValue = angular.isString(ctrl.data) ? ctrl.data.trim() : ctrl.data;
            }

            if (angular.isDefined(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback({newData: ctrl.inputValue, field: angular.isDefined(ctrl.updateDataField) ? ctrl.updateDataField : ctrl.inputName});
            }
        }

        /**
         * Clear search input field
         */
        function clearInputField() {
            ctrl.data = '';
            updateInputValue();
        }

        //
        // Private methods
        //

        /**
         * Sets or reverts outer model value
         */
        function setOrRevertInputValue() {
            $timeout(function () {
                if (ctrl.isDataRevert === 'true') {

                    // If input is invalid - inner model value is set to undefined by Angular
                    if (angular.isDefined(ctrl.data) && ctrl.startValue !== Number(ctrl.data)) {
                        ctrl.inputValue = angular.isString(ctrl.data) ? ctrl.data.trim() : ctrl.data;
                        if (angular.isFunction(ctrl.itemBlurCallback)) {
                            ctrl.itemBlurCallback({inputValue: ctrl.inputValue});
                        }
                        ctrl.startValue = Number(ctrl.data);
                    } else {

                        // Revert input value; Outer model value just does not change
                        ctrl.data = ctrl.inputValue;
                        if (angular.isFunction(ctrl.onBlur)) {
                            ctrl.onBlur();
                        }
                    }
                }
            });
        }
    }

    validatingInput.run(["$templateCache", function($templateCache) {
        $templateCache.put('testShared/validating-input-field.tpl.html',
        '<div class="validating-input-field" data-ng-class="{\'focused\': $ctrl.inputFocused, \'with-counter\': $ctrl.validationMaxLength && $ctrl.isCounterVisible()}"><div data-ng-if="$ctrl.fieldType === \'input\'"><div class="input-counter" data-ng-class="{\'invalid\': $ctrl.getRemainingSymbolsCounter() < 0}" data-ng-if="!$ctrl.onlyValidCharacters || $ctrl.isCounterVisible()">{{$ctrl.getRemainingSymbolsCounter()}}</div><div data-ng-hide="$ctrl.inputFocused || $ctrl.formObject[$ctrl.inputName].$viewValue" class="input-placeholder" data-ng-style="{\'left\': $ctrl.inputIcon ? \'33px\' : \'11px\'}">{{$ctrl.placeholderText}}</div><input class="input-field field" tabindex="0" data-ng-class="{\'invalid\': $ctrl.isFieldInvalid()}" data-ng-style="{\'padding-left\': $ctrl.inputIcon ? \'32px\' : \'10px\'}" name="{{$ctrl.inputName}}" data-ng-attr-autofocus="{{$ctrl.isFocused}}" data-ng-model="$ctrl.data" data-ng-model-options="$ctrl.inputModelOptions" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" data-ng-disabled="$ctrl.isDisabled" data-ng-keydown="$ctrl.keyDown($event)" data-igz-input-only-valid-characters="$ctrl.validationPattern" data-only-valid-characters="{{$ctrl.onlyValidCharacters}}" spellcheck="{{$ctrl.spellcheck}}" maxlength="{{$ctrl.onlyValidCharacters ? $ctrl.validationMaxLength : null}}" data-igz-input-blur-on-enter><span data-ng-if="$ctrl.inputIcon" class="input-icon {{$ctrl.inputIcon}}"></span><span class="clear-button igz-icon-close" data-ng-show="$ctrl.data && $ctrl.isClearIcon" data-ng-click="$ctrl.clearInputField()"></span></div><div data-ng-if="$ctrl.fieldType === \'textarea\'"><div class="textarea-counter" data-ng-class="{\'invalid\': $ctrl.getRemainingSymbolsCounter() < 0}" data-ng-if="!$ctrl.onlyValidCharacters || $ctrl.isCounterVisible()">{{$ctrl.getRemainingSymbolsCounter()}}</div><div data-ng-hide="$ctrl.inputFocused || $ctrl.formObject[$ctrl.inputName].$viewValue" class="textarea-placeholder">{{$ctrl.placeholderText}}</div><textarea class="textarea-field field" tabindex="0" data-ng-class="{\'invalid\': $ctrl.isFieldInvalid()}" name="{{$ctrl.inputName}}" data-ng-attr-autofocus="{{$ctrl.isFocused}}" data-ng-model="$ctrl.data" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" spellcheck="{{$ctrl.spellcheck}}" data-igz-input-blur-on-enter></textarea></div><div data-ng-if="$ctrl.fieldType === \'password\'"><div data-ng-hide="$ctrl.inputFocused || $ctrl.formObject[$ctrl.inputName].$viewValue" class="input-placeholder">{{$ctrl.placeholderText}}</div><input class="input-field field" tabindex="0" data-igz-validate-password-confirmation="$ctrl.compareInputValue" type="password" name="{{$ctrl.inputName}}" data-ng-attr-autofocus="{{$ctrl.isFocused}}" data-ng-model="$ctrl.data" data-ng-model-options="$ctrl.inputModelOptions" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" data-igz-input-blur-on-enter></div></div>');
    ]);
  );
}());
