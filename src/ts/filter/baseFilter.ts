import {Component} from "../widgets/component";
import {BaseFloatingFilterChange, FloatingFilterChange} from "./floatingFilter";
import {IDoesFilterPassParams, IFilterComp, IFilterParams} from "../interfaces/iFilter";
import {Autowired} from "../context/context";
import {GridOptionsWrapper} from "../gridOptionsWrapper";
import {DEFAULT_TRANSLATIONS, FilterTypes} from "./filterConsts";
import {INumberFilterParams} from "./numberFilter";


/**
 * T(ype) The type of this filter. ie in DateFilter T=Date
 * P(arams) The params that this filter can take
 * M(model getModel/setModel) The object that this filter serializes to
 * F Floating filter params
 *
 * Contains common logic to ALL filters.. Translation, apply and clear button
 * get/setModel context wiring....
 */
export abstract class BaseFilterComp<T, P extends IFilterParams, M> extends Component implements IFilterComp {
    @Autowired('gridOptionsWrapper')
    gridOptionsWrapper: GridOptionsWrapper;


    filterParams: P;
    // private newRowsActionKeep: boolean;
    // clearActive: boolean;
    // applyActive: boolean;
    defaultFilter: string;
    filter: string;


    public init(params: P): void {
        this.filterParams = params;
        this.defaultFilter = this.filterParams.defaultOption;
        if (this.filterParams.filterOptions && !this.defaultFilter) {
            if (this.filterParams.filterOptions.lastIndexOf(FilterTypes.EQUALS) < 0) {
                this.defaultFilter = this.filterParams.filterOptions[0];
            }
        }
        this.filter = this.defaultFilter;
        // this.clearActive = params.clearButton === true;
        //Allowing for old param property apply, even though is not advertised through the interface
        // this.applyActive = ((params.applyButton === true) || ((<any>params).apply === true));
        // this.newRowsActionKeep = params.newRowsAction === 'keep';
    }

    public onClearButton() {
        this.setModel(null);
        this.onFilterChanged();
    }

    public customInit(): void{

    }
    public isFilterActive(): boolean{
        return false;
    }
    public modelFromFloatingFilter(from: string): M{
        return  null;
    }
    public doesFilterPass(params: IDoesFilterPassParams): boolean{
        return false;
    }

    public resetState(): void{

    }
    public serialize(): M{
        return null;
    }
    public parse(toParse: M): void {}

    public floatingFilter(from: string): void {
        if (from !== '') {
            let model: M = this.modelFromFloatingFilter(from);
            this.setModel(model);
        } else {
            this.resetState();
        }
        this.onFilterChanged();
    }

    public onNewRowsLoaded() {
        // if (!this.newRowsActionKeep) {
        //     this.resetState ();
        // }
    }

    public getModel(): M {
        if (this.isFilterActive()) {
            return this.serialize();
        } else {
            return null;
        }
    }

    public getNullableModel(): M {
        return this.serialize();
    }

    public setModel(model: M): void {
        if (model) {
            this.parse (model);
        } else {
            this.resetState();
        }
    }

    private doOnFilterChanged(applyNow: boolean = false): boolean {
        // this.filterParams.filterModifiedCallback();
        // let requiresApplyAndIsApplying: boolean = this.applyActive && applyNow;
        // let notRequiresApply: boolean = !this.applyActive;
        //
        // let shouldFilter: boolean = notRequiresApply || requiresApplyAndIsApplying;
        // if (shouldFilter) {
        //     this.filterParams.filterChangedCallback();
        // }
        // return shouldFilter;
        return false;
    }

    public onFilterChanged(applyNow: boolean = false): void {
        this.doOnFilterChanged(applyNow);
    }

    public onFloatingFilterChanged(change: FloatingFilterChange): boolean {
        //It has to be of the type FloatingFilterWithApplyChange if it gets here
        let casted: BaseFloatingFilterChange<M> = <BaseFloatingFilterChange<M>>change;
        this.setModel(casted ? casted.model : null);
        return this.doOnFilterChanged(casted ? casted.apply : false);
    }



    public translate(toTranslate: string): string {
        let translate = this.gridOptionsWrapper.getLocaleTextFunc();
        return translate(toTranslate, DEFAULT_TRANSLATIONS[toTranslate]);
    }

    public getDebounceMs(filterParams: IFilterParams | INumberFilterParams): number {
        // if (filterParams.applyButton && filterParams.debounceMs) {
        //     console.warn('ag-Grid: debounceMs is ignored when applyButton = true');
        //     return 0;
        // }

        // return filterParams.debounceMs != null ? filterParams.debounceMs : 500;
        return 0;
    }
}
