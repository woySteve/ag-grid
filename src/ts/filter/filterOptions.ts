import {Component} from "../widgets/component";
import {IComponent} from "../interfaces/iComponent";
import {FilterTypes} from "./filterConsts";
import {QuerySelector} from "../widgets/componentAnnotations";
import {FilterTextComparator} from "./textFilter";
import {Comparator} from "./filterGroupComp";

export interface FilterHeaderMetadata {
    applicableFilterTypes: string[];
    sensibleDefault: string;
}

export type FilterComparators = {[p:string]:Comparator<any>}
export type ComparableFilterHeaderType = 'TEXT' | 'NUMBER';

const METADATA_BY_FILTER_TYPE:{[p:string]:FilterHeaderMetadata} = {
    'TEXT': {
        applicableFilterTypes: [
            FilterTypes.EQUALS,
            FilterTypes.NOT_EQUAL,
            FilterTypes.STARTS_WITH,
            FilterTypes.ENDS_WITH,
            FilterTypes.CONTAINS,
            FilterTypes.NOT_CONTAINS
        ],
        sensibleDefault:  FilterTypes.CONTAINS,
    },'NUMBER': {
        applicableFilterTypes: [
            FilterTypes.EQUALS,
            FilterTypes.NOT_EQUAL,
            FilterTypes.LESS_THAN,
            FilterTypes.LESS_THAN_OR_EQUAL,
            FilterTypes.GREATER_THAN,
            FilterTypes.GREATER_THAN_OR_EQUAL,
            FilterTypes.IN_RANGE
        ],
        sensibleDefault:  FilterTypes.EQUALS
    }
};

export interface IComparableFilterHeaderParams {
    type: ComparableFilterHeaderType;
    restrictedToOptions:string[];
    translateCb : (src:string)=>string;
    userDefaultOption: string;
    onFilterTypeChanged: ()=>void;
    customComparator?: FilterTextComparator
}

export interface IComparableFilterHeader {
    setFilterType(filterType: string):void;

    resetFilterType(): void;

    getCurrentOperator(): string;
}

export interface IComparableFilterHeaderComp extends IComparableFilterHeader, IComponent<IComparableFilterHeaderParams> {
}

export class FilterOptions extends Component implements IComparableFilterHeaderComp{
    private params:IComparableFilterHeaderParams;
    private defaultFilter: string;
    private filter: string;


    @QuerySelector('#filterType')
    private eTypeSelector: HTMLSelectElement;

    public init (params:IComparableFilterHeaderParams):void{
        this.params = params;

        this.defaultFilter = this.params.userDefaultOption;
        let sensibleDefault = METADATA_BY_FILTER_TYPE [this.params.type].sensibleDefault;

        if (this.params.restrictedToOptions && !this.defaultFilter) {
            if (this.params.restrictedToOptions.lastIndexOf(sensibleDefault) < 0) {
                this.defaultFilter = this.params.restrictedToOptions[0];
            }
        }
        if (!this.defaultFilter) {
            this.defaultFilter = sensibleDefault;
        }
        this.filter = this.defaultFilter;
        this.setTemplate(this.generateFilterHeader());
        this.setFilterType (this.filter);

        this.addDestroyableEventListener(this.eTypeSelector, "change", this.onFilterTypeChanged.bind(this));
    }

    public generateFilterHeader(): string {
        let defaultFilterTypes = this.getApplicableFilterTypes();
        let restrictedFilterTypes = this.params.restrictedToOptions;
        let actualFilterTypes = restrictedFilterTypes ? restrictedFilterTypes : defaultFilterTypes;

        let optionsHtml: string[] = actualFilterTypes.map(filterType => {
            let localeFilterName = this.params.translateCb(filterType);
            return `<option value="${filterType}">${localeFilterName}</option>`;
        });

        let readOnly = optionsHtml.length == 1 ? 'disabled' : '';

        return optionsHtml.length <= 0 ?
            '' :
            `<div>
                <select class="ag-filter-select" id="filterType" ${readOnly}>
                    ${optionsHtml.join('')}
                </select>
            </div>`;
    }

    public getApplicableFilterTypes(): string[] {
        return METADATA_BY_FILTER_TYPE [this.params.type].applicableFilterTypes;
    }

    private onFilterTypeChanged(): void {
        this.filter = this.eTypeSelector.value;
        this.params.onFilterTypeChanged ();
    }

    public setFilterType(filterType: string): void {
        this.filter = filterType;
        this.eTypeSelector.value = filterType;
    }

    resetFilterType(): void {
        this.setFilterType(this.defaultFilter);
    }

    getCurrentOperator(): string {
        return this.filter ? this.filter : this.defaultFilter;
    }
}