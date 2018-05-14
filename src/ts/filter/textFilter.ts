import {Utils as _} from "../utils";
import {IDoesFilterPassParams, IFilterComp, IFilterParams, SerializedFilter} from "../interfaces/iFilter";
import {QuerySelector} from "../widgets/componentAnnotations";
import {GridOptionsWrapper} from "../gridOptionsWrapper";
import {Autowired} from "../context/context";
import {BaseFilterCondition} from "./baseFilterCondition";
import {ComparableFilterHeaderType} from "./filterOptions";
import {FilterTypes} from "./filterConsts";

export interface SerializedTextFilter extends SerializedFilter {
    filter: string;
    type: string;
}

export interface FilterTextComparator {
    (filter: string, gridValue: any, filterText: string): boolean;
}

export interface TextComparator {
    (gridValue: any, filterText: string): boolean;
}

export interface TextFormatter {
    (from: string): string;
}

export interface ITextFilterParams extends IFilterParams {
    textCustomComparator?: FilterTextComparator;
    debounceMs?: number;
    caseSensitive?: boolean;
}

export class TextFilter extends BaseFilterCondition<string, ITextFilterParams, SerializedTextFilter> implements IFilterComp {
    @Autowired('gridOptionsWrapper')
    gridOptionsWrapper: GridOptionsWrapper;

    @QuerySelector('#filterText')
    private eFilterTextField: HTMLInputElement;

    private filterText: string;
    private formatter: TextFormatter;
    private comparator: FilterTextComparator;

    static DEFAULT_FORMATTER: TextFormatter = (from: string)=> {
        return from;
    };
    static DEFAULT_LOWERCASE_FORMATTER: TextFormatter = (from: string)=> {
        if (from == null) { return null; }
        return from.toString().toLowerCase();
    };
    static DEFAULT_COMPARATOR: FilterTextComparator = (filter: string, value: any, filterText: string)=> {
        switch (filter) {
            case FilterTypes.CONTAINS:
                return value.indexOf(filterText) >= 0;
            case FilterTypes.NOT_CONTAINS:
                return value.indexOf(filterText) === -1;
            case FilterTypes.EQUALS:
                return value === filterText;
            case FilterTypes.NOT_EQUAL:
                return value != filterText;
            case FilterTypes.STARTS_WITH:
                return value.indexOf(filterText) === 0;
            case FilterTypes.ENDS_WITH:
                let index = value.lastIndexOf(filterText);
                return index >= 0 && index === (value.length - filterText.length);
            default:
                // should never happen
                console.warn('invalid filter type ' + filter);
                return false;
        }
    };

    public init (params:ITextFilterParams):void{
        super.init(params);
        this.comparator = params.textCustomComparator ? params.textCustomComparator : TextFilter.DEFAULT_COMPARATOR;
        this.formatter =
            this.getParams().textFormatter ? this.getParams().textFormatter :
            this.getParams().caseSensitive == true ? TextFilter.DEFAULT_FORMATTER :
                TextFilter.DEFAULT_LOWERCASE_FORMATTER;
    }

    public bodyTemplate(): string {
        let translate = this.translate.bind(this);
        return `<div class="ag-filter-body">
            <input class="ag-filter-filter" id="filterText" type="text" placeholder="${translate('filterOoo', 'Filter...')}"/>
        </div>`;
    }

    public initialiseFilterBodyUi() {
        this.addDestroyableEventListener(this.eFilterTextField, 'input', this.onFilterTextFieldChanged.bind(this));
    }

    public afterGuiAttached() {
        this.eFilterTextField.focus();
    }

    public filterValues(): string {
        return this.filterText;
    }

    public doesFilterPass(params: IDoesFilterPassParams):boolean {
        if (!this.filterText) {
            return true;
        }
        let value = this.getParams().valueGetter(params.node);
        let valueFormatted: string = this.formatter(value);
        return this.comparator (this.getFilterHeader().getCurrentOperator(), valueFormatted, this.filterText);
    }

    private onFilterTextFieldChanged() {
        let filterText = _.makeNull(this.eFilterTextField.value);
        if (filterText && filterText.trim() === '') {
            filterText = null;
        }

        if (this.filterText !== filterText) {
            let newLowerCase =
                filterText && this.getParams().caseSensitive != true ? filterText.toLowerCase() :
                filterText;
            let previousLowerCase = this.filterText && this.getParams().caseSensitive != true  ? this.filterText.toLowerCase() :
                this.filterText;

            this.filterText = this.formatter(filterText);
            if (previousLowerCase !== newLowerCase) {
                this.onFilterChanged();
            }
        }
    }

    public setFilter(filter: string): void {
        filter = _.makeNull(filter);

        if (filter) {
            this.filterText = this.formatter(filter);
            this.eFilterTextField.value = filter;
        } else {
            this.filterText = null;
            this.eFilterTextField.value = null;
        }
    }

    public getFilter(): string {
        return this.filterText;
    }



    getModelAsString(model: any): string {
        return "";
    }

    public serialize(): SerializedTextFilter {
        return {
            type: this.getFilterHeader().getCurrentOperator (),
            filter: this.filterText,
            filterType: 'text'
        };
    }


    public parse(model: SerializedTextFilter): void {
        this.getFilterHeader().setFilterType(model.type);
        this.setFilter(model.filter);
    }

    public resetState(): void {
        this.setFilter(null);
        this.getFilterHeader().resetFilterType();
    }

    getFilterType(): ComparableFilterHeaderType {
        return 'TEXT';
    }

}
