import {Utils as _} from "../utils";
import {IDoesFilterPassParams, IFilterComp, SerializedFilter} from "../interfaces/iFilter";
import {QuerySelector} from "../widgets/componentAnnotations";
import {IScalarFilterParams} from "./filterCondition";
import {FilterTypes} from "./filterConsts";
import {Comparator} from "./filterGroupComp";
import {ComparableFilterHeaderType} from "./filterOptions";
import {ScalarBaseFilter} from "./baseFilterCondition";

export interface SerializedNumberFilter extends SerializedFilter {
    filter: number;
    filterTo: number;
    type: string;
}

export interface INumberFilterParams extends IScalarFilterParams {
    debounceMs?: number;
}

export class NumberFilter extends ScalarBaseFilter<number, INumberFilterParams, SerializedNumberFilter> implements IFilterComp {
    @QuerySelector('#filterNumberToPanel')
    private eNumberToPanel: HTMLElement;

    filterNumber: any;
    filterNumberTo: any;

    @QuerySelector('#filterToText')
    private eFilterToTextField: HTMLInputElement;

    private eFilterTextField: HTMLInputElement;

    modelFromFloatingFilter(from: string): SerializedNumberFilter {
        return {
            type: this.getFilterHeader().getCurrentOperator(),
            filter: Number(from),
            filterTo: this.filterNumberTo,
            filterType: 'number'
        };
    }

    public bodyTemplate(): string {
        let translate = this.translate.bind(this);
        return `<div class="ag-filter-body">
            <div>
                <input class="ag-filter-filter" id="filterText" type="text" placeholder="${translate('filterOoo')}"/>
            </div>
             <div class="ag-filter-number-to" id="filterNumberToPanel">
                <input class="ag-filter-filter" id="filterToText" type="text" placeholder="${translate('filterOoo')}"/>
            </div>
        </div>`;
    }

    public initialiseFilterBodyUi() {
        this.filterNumber = null;
        this.eFilterTextField = this.queryForHtmlInputElement("#filterText");

        this.addDestroyableEventListener(this.eFilterTextField, "input", this.onTextFieldsChanged.bind(this));
        this.addDestroyableEventListener(this.eFilterToTextField, "input", this.onTextFieldsChanged.bind(this));
        this.refreshFilterBodyUi();
    }

    public afterGuiAttached() {
        this.eFilterTextField.focus();
    }

    public comparator(): Comparator<number> {
        return (left: number, right: number): number=> {
            if (left === right) { return 0; }
            if (left < right) { return 1; }
            if (left > right) { return -1; }
        };
    }

    private onTextFieldsChanged() {
        let newFilter = this.stringToFloat(this.eFilterTextField.value);
        let newFilterTo = this.stringToFloat(this.eFilterToTextField.value);
        if (this.filterNumber !== newFilter || this.filterNumberTo !== newFilterTo) {
            this.filterNumber = newFilter;
            this.filterNumberTo = newFilterTo;
            this.onFilterChanged();
        }
    }

    public filterValues(): number|number[] {
        return this.getFilterHeader().getCurrentOperator() !== FilterTypes.IN_RANGE ?
            this.asNumber(this.filterNumber):
            [this.asNumber(this.filterNumber), this.asNumber(this.filterNumberTo)];
    }

    private asNumber(value: any): number {
        return _.isNumeric(value) ? value : null;
    }

    private stringToFloat(value: string): number {
        let filterText = _.makeNull(value);
        if (filterText && filterText.trim() === '') {
            filterText = null;
        }
        let newFilter: number;
        if (filterText !== null && filterText !== undefined) {
            newFilter = parseFloat(filterText);
        } else {
            newFilter = null;
        }
        return newFilter;
    }

    public setFilter(filter: any) {
        filter = _.makeNull(filter);

        if (filter !== null && !(typeof filter === 'number')) {
            filter = parseFloat(filter);
        }
        this.filterNumber = filter;
        this.eFilterTextField.value = filter;
    }

    public setFilterTo(filter: any) {
        filter = _.makeNull(filter);

        if (filter !== null && !(typeof filter === 'number')) {
            filter = parseFloat(filter);
        }
        this.filterNumberTo = filter;
        this.eFilterToTextField.value = filter;
    }

    public getFilter() {
        return this.filterNumber;
    }

    public serialize(): SerializedNumberFilter {
        return {
            type: this.getFilterHeader().getCurrentOperator(),
            filter: this.filterNumber,
            filterTo: this.filterNumberTo,
            filterType: 'number'
        };
    }

    public parse(model: SerializedNumberFilter): void {
        this.getFilterHeader().setFilterType(model.type);
        this.setFilter(model.filter);
        this.setFilterTo(model.filterTo);
    }

    public refreshFilterBodyUi(): void {
        let visible = this.getFilterHeader().getCurrentOperator() === FilterTypes.IN_RANGE;
        _.setVisible(this.eNumberToPanel, visible);
    }

    public resetState(): void {
        this.getFilterHeader().resetFilterType();
        this.setFilter(null);
        this.setFilterTo(null);
    }

    public setType(filterType: string): void {
        this.getFilterHeader().setFilterType(filterType);
    }

    getFilterType(): ComparableFilterHeaderType {
        return 'NUMBER';
    }
}
