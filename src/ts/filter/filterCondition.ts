import {IDoesFilterPassParams, IFilterParams} from "../interfaces/iFilter";
import {QuerySelector} from "../widgets/componentAnnotations";
import {BaseFilterComp} from "./baseFilter";
import {_} from "../utils";
import {FilterTypes} from "./filterConsts";
import {Comparator} from "./filterGroupComp";

/**
 * Every filter with a dropdown where the user can specify a comparing type against the filter values
 */
export abstract class ComparableBaseFilter<T, P extends IFilterParams, M> extends BaseFilterComp<T, P, M> {
    @QuerySelector('#filterType')
    private eTypeSelector: HTMLSelectElement;

    public abstract getApplicableFilterTypes(): string[];
    public abstract filterValues(): T | T[];

    public init(params: P) {
        super.init(params);
        let header:string = this.generateFilterHeader ();

        this.getGui().insertBefore(_.loadTemplate(header), this.getGui().firstChild);
        this.wireQuerySelectors();
        this.addDestroyableEventListener(this.eTypeSelector, "change", this.onFilterTypeChanged.bind(this));
        if (!this.defaultFilter) {
            this.defaultFilter = this.getDefaultType();
        }
        this.initialiseFilterBodyUi();
    }

    public generateFilterHeader(): string {
        let defaultFilterTypes = this.getApplicableFilterTypes();
        let restrictedFilterTypes = this.filterParams.filterOptions;
        let actualFilterTypes = restrictedFilterTypes ? restrictedFilterTypes : defaultFilterTypes;

        let optionsHtml: string[] = actualFilterTypes.map(filterType => {
            let localeFilterName = this.translate(filterType);
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

    public initialiseFilterBodyUi() {
        this.setFilterType(this.filter);
    }

    public abstract getDefaultType(): string;

    private onFilterTypeChanged(): void {
        this.filter = this.eTypeSelector.value;
        // we check if filter is active, so that if user changes the type (eg from 'less than' to 'equals'),
        // well this doesn't matter if the user has no value in the text field, so don't fire 'onFilterChanged'.
        // this means we don't refresh the grid when the type changes if no value is present.
        if (this.isFilterActive()) {
            this.onFilterChanged();
        }
    }

    public isFilterActive(): boolean {
        let rawFilterValues = this.filterValues();
        if (this.filter === FilterTypes.IN_RANGE) {
            let filterValueArray = (<T[]>rawFilterValues);
            return filterValueArray[0] != null && filterValueArray[1] != null;
        } else {
            return rawFilterValues != null;
        }
    }

    public setFilterType(filterType: string): void {
        this.filter = filterType;
        this.eTypeSelector.value = filterType;
    }
}

export interface NullComparator {
    equals?: boolean;
    lessThan?: boolean;
    greaterThan?: boolean;
}

export interface IScalarFilterParams extends IFilterParams {
    inRangeInclusive?: boolean;
    nullComparator?: NullComparator;
}

/**
 * Comparable filter with scalar underlying values (ie numbers and dates. Strings are not scalar so have to extend
 * ComparableBaseFilter)
 */
export abstract class ScalarBaseFilter<T, P extends IScalarFilterParams, M> extends ComparableBaseFilter<T, P, M> {
    static readonly DEFAULT_NULL_COMPARATOR: NullComparator = {
        equals: false,
        lessThan: false,
        greaterThan: false
    };

    public abstract comparator(): Comparator<T>;

    public getDefaultType(): string {
        return FilterTypes.EQUALS;
    }

    private nullComparator(type: string): Comparator<T> {
        return (filterValue: T, gridValue: T): number => {
            if (gridValue == null) {
                let nullValue = this.translateNull (type);
                if (this.filter === FilterTypes.EQUALS) {
                    return nullValue? 0 : 1;
                }

                if (this.filter === FilterTypes.GREATER_THAN) {
                    return nullValue? 1 : -1;
                }

                if (this.filter === FilterTypes.GREATER_THAN_OR_EQUAL) {
                    return nullValue? 1 : -1;
                }

                if (this.filter === FilterTypes.LESS_THAN_OR_EQUAL) {
                    return nullValue? -1 : 1;
                }

                if (this.filter === FilterTypes.LESS_THAN) {
                    return nullValue? -1 : 1;
                }

                if (this.filter === FilterTypes.NOT_EQUAL) {
                    return nullValue? 1 : 0;
                }
            }

            let actualComparator: Comparator<T> = this.comparator();
            return actualComparator (filterValue, gridValue);
        };
    }

    private translateNull(type: string): boolean {
        let reducedType: string =
            type.indexOf('greater') > -1 ? 'greaterThan':
                type.indexOf('lessThan') > -1 ? 'lessThan':
                    'equals';

        if (this.filterParams.nullComparator && (<any>this.filterParams.nullComparator)[reducedType]) {
            return (<any>this.filterParams.nullComparator)[reducedType];
        }

        return (<any>ScalarBaseFilter.DEFAULT_NULL_COMPARATOR)[reducedType];
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        let value: any = this.filterParams.valueGetter(params.node);
        let comparator: Comparator<T> = this.nullComparator (this.filter);

        let rawFilterValues: T[] | T= this.filterValues();
        let from: T= Array.isArray(rawFilterValues) ? rawFilterValues[0]: rawFilterValues;
        if (from == null) { return true; }

        let compareResult = comparator(from, value);

        if (this.filter === FilterTypes.EQUALS) {
            return compareResult === 0;
        }

        if (this.filter === FilterTypes.GREATER_THAN) {
            return compareResult > 0;
        }

        if (this.filter === FilterTypes.GREATER_THAN_OR_EQUAL) {
            return compareResult >= 0;
        }

        if (this.filter === FilterTypes.LESS_THAN_OR_EQUAL) {
            return compareResult <= 0;
        }

        if (this.filter === FilterTypes.LESS_THAN) {
            return compareResult < 0;
        }

        if (this.filter === FilterTypes.NOT_EQUAL) {
            return compareResult != 0;
        }

        //From now on the type is a range and rawFilterValues must be an array!
        let compareToResult: number = comparator((<T[]>rawFilterValues)[1], value);
        if (this.filter === FilterTypes.IN_RANGE) {
            if (!this.filterParams.inRangeInclusive) {
                return compareResult > 0 && compareToResult < 0;
            } else {
                return compareResult >= 0 && compareToResult <= 0;
            }
        }

        throw new Error('Unexpected type of date filter!: ' + this.filter);
    }
}