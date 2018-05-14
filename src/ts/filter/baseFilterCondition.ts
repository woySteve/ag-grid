import {
    FilterOptions, ComparableFilterHeaderType,
    IComparableFilterHeaderComp,
    IComparableFilterHeaderParams
} from "./filterOptions";
import {ComponentResolver} from "../components/framework/componentResolver";
import {GridOptionsWrapper} from "../gridOptionsWrapper";
import {Utils as _} from "../utils";
import {IDoesFilterPassParams, IFilter, IFilterParams} from "../interfaces/iFilter";
import {Autowired} from "../context/context";
import {DEFAULT_TRANSLATIONS, FilterTypes} from "./filterConsts";
import {Component} from "../widgets/component";
import {BaseFloatingFilterChange} from "./floatingFilter";
import {IScalarFilterParams, NullComparator} from "./filterCondition";
import {Comparator} from "./filterGroupComp";

/**
 * T(ype) The type of this filter. ie in DateFilter T=Date
 * P(arams) The params that this filter can take
 * M(model getModel/setModel) The object that this filter serializes to
 * F Floating filter params
 *
 * Contains common logic to ALL filters.. Translation, apply and clear button
 * get/setModel context wiring....
 */
export abstract class BaseFilterCondition<T, P extends IFilterParams, M> extends Component implements  IFilter{
    @Autowired('gridOptionsWrapper')
    gridOptionsWrapper: GridOptionsWrapper;

    @Autowired ('componentResolver')
    private componentSelector:ComponentResolver;

    private filterParams: P;
    private filterHeader:IComparableFilterHeaderComp;

    abstract serialize (): M;
    abstract filterValues (): T|T[];
    abstract doesFilterPass(params: IDoesFilterPassParams): boolean;
    abstract parse (model:M): void;
    abstract resetState (): void;
    abstract bodyTemplate (): string;
    abstract initialiseFilterBodyUi (): void;
    abstract getFilterType (): ComparableFilterHeaderType;

    public init (params:P): void{
        this.filterParams = params;
        this.filterHeader = this.componentSelector.createInternalAgGridComponent <IComparableFilterHeaderComp>(
            FilterOptions,
            <IComparableFilterHeaderParams>{
                type: this.getFilterType(),
                restrictedToOptions: params.filterOptions,
                translateCb: this.translate.bind(this)
            }
        );

        this.setTemplateFromElement(this.filterHeader.getGui());
        this.getGui().appendChild(_.loadTemplate(this.bodyTemplate()));
        this.wireQuerySelectors();
        this.initialiseFilterBodyUi();
    }

    public translate(toTranslate: string): string {
        let translate = this.gridOptionsWrapper.getLocaleTextFunc();
        return translate(toTranslate, DEFAULT_TRANSLATIONS[toTranslate]);
    }

    getModel(): M {
        if (this.isFilterActive()) {
            return this.serialize();
        } else {
            return null;
        }
    }

    public isFilterActive(): boolean {
        let rawFilterValues = this.filterValues();
        return rawFilterValues != null;
    }

    onFloatingFilterChanged(change: any): void {
        //It has to be of the type FloatingFilterWithApplyChange if it gets here
        let casted: BaseFloatingFilterChange<M> = <BaseFloatingFilterChange<M>>change;
        this.setModel(casted ? casted.model : null);
        this.onFilterChanged();
    }

    setModel(model: M): void {
        if (model) {
            this.parse (model);
        } else {
            this.resetState();
        }
    }

    public onFilterChanged(): void {
        this.filterParams.filterConditionModifiedCallback();
    }

    public getParams ():P {
        return this.filterParams;
    }

    getFilterHeader ():IComparableFilterHeaderComp {
        return this.filterHeader;
    }
}

/**
 * Comparable filter with scalar underlying values (ie numbers and dates. Strings are not scalar so have to extend
 * ComparableBaseFilter)
 */
export abstract class ScalarBaseFilter<T, P extends IScalarFilterParams, M> extends BaseFilterCondition<T, P, M>{
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
                let currentFilterOption = this.getFilterHeader().getCurrentOperator();
                let nullValue = this.translateNull (type);
                if (currentFilterOption === FilterTypes.EQUALS) {
                    return nullValue? 0 : 1;
                }

                if (currentFilterOption === FilterTypes.GREATER_THAN) {
                    return nullValue? 1 : -1;
                }

                if (currentFilterOption === FilterTypes.GREATER_THAN_OR_EQUAL) {
                    return nullValue? 1 : -1;
                }

                if (currentFilterOption === FilterTypes.LESS_THAN_OR_EQUAL) {
                    return nullValue? -1 : 1;
                }

                if (currentFilterOption === FilterTypes.LESS_THAN) {
                    return nullValue? -1 : 1;
                }

                if (currentFilterOption === FilterTypes.NOT_EQUAL) {
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

        if (this.getParams().nullComparator && (<any>this.getParams().nullComparator)[reducedType]) {
            return (<any>this.getParams().nullComparator)[reducedType];
        }

        return (<any>ScalarBaseFilter.DEFAULT_NULL_COMPARATOR)[reducedType];
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        let value: any = this.getParams().valueGetter(params.node);
        let currentFilterOption = this.getFilterHeader().getCurrentOperator();
        let comparator: Comparator<T> = this.nullComparator (currentFilterOption);

        let rawFilterValues: T[] | T= this.filterValues();
        let from: T= Array.isArray(rawFilterValues) ? rawFilterValues[0]: rawFilterValues;
        if (from == null) { return true; }

        let compareResult = comparator(from, value);

        if (currentFilterOption === FilterTypes.EQUALS) {
            return compareResult === 0;
        }

        if (currentFilterOption === FilterTypes.GREATER_THAN) {
            return compareResult > 0;
        }

        if (currentFilterOption === FilterTypes.GREATER_THAN_OR_EQUAL) {
            return compareResult >= 0;
        }

        if (currentFilterOption === FilterTypes.LESS_THAN_OR_EQUAL) {
            return compareResult <= 0;
        }

        if (currentFilterOption === FilterTypes.LESS_THAN) {
            return compareResult < 0;
        }

        if (currentFilterOption === FilterTypes.NOT_EQUAL) {
            return compareResult != 0;
        }

        //From now on the type is a range and rawFilterValues must be an array!
        let compareToResult: number = comparator((<T[]>rawFilterValues)[1], value);
        if (currentFilterOption === FilterTypes.IN_RANGE) {
            if (!this.getParams().inRangeInclusive) {
                return compareResult > 0 && compareToResult < 0;
            } else {
                return compareResult >= 0 && compareToResult <= 0;
            }
        }

        throw new Error('Unexpected type of date filter!: ' + currentFilterOption);
    }
}