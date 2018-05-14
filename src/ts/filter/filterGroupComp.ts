import {IDoesFilterPassParams, IFilterComp, IFilterGroupComp, IFilterGroupParams} from "../interfaces/iFilter";
import {_} from "../utils";
import {Autowired, Context} from "../context/context";
import {GridOptionsWrapper} from "../gridOptionsWrapper";
import {QuerySelector} from "../widgets/componentAnnotations";
import {Component} from "../widgets/component";
import {DEFAULT_TRANSLATIONS} from "./filterConsts";

export interface Comparator<T> {
    (left: T, right: T): number;
}

/**
 * T(ype) The type of this filter. ie in DateFilter T=Date
 * P(arams) The params that this filter can take
 * M(model getModel/setModel) The object that this filter serializes to
 * F Floating filter params
 *
 * Contains common logic to ALL filters.. Translation, apply and clear button
 * get/setModel context wiring....
 */
export class FilterGroupComp<T, P extends IFilterGroupParams, M> extends Component implements IFilterGroupComp {
    @QuerySelector('#applyPanel')
    private eButtonsPanel: HTMLElement;

    @QuerySelector('#applyButton')
    private eApplyButton: HTMLElement;

    @QuerySelector('#clearButton')
    private eClearButton: HTMLElement;

    @Autowired('context')
    public context: Context;

    @Autowired('gridOptionsWrapper')
    gridOptionsWrapper: GridOptionsWrapper;

    private filterComponent1:IFilterComp;
    private filterComponent2:IFilterComp;

    private newRowsActionKeep: boolean;
    private clearActive: boolean;
    private applyActive: boolean;
    private filterParams:P;


    public init(params: P): void {
        this.filterParams = params;
        this.clearActive = params.clearButton === true;
        //Allowing for old param property apply, even though is not advertised through the interface
        this.applyActive = ((params.applyButton === true) || ((<any>params).apply === true));
        this.newRowsActionKeep = params.newRowsAction === 'keep';

        this.setTemplate(this.generateTemplate());
        _.setVisible(this.eApplyButton, this.applyActive);
        if (this.applyActive) {
            this.addDestroyableEventListener(this.eApplyButton, "click", this.filterParams.filterChangedCallback);
        }

        _.setVisible(this.eClearButton, this.clearActive);
        if (this.clearActive) {
            this.addDestroyableEventListener(this.eClearButton, "click", this.onClearButton.bind(this));
        }

        let anyButtonVisible: boolean = this.applyActive || this.clearActive;
        _.setVisible(this.eButtonsPanel, anyButtonVisible);

        this.instantiate(this.context);
        // POC: NEW CODE TO INSTANTIATE THE FIRST INSTANCE OF THE FILTER ALWAYS
        this.filterParams.createFilterCb ().then (filterComp=>{
            this.filterComponent1 = filterComp;
            this.getGui().insertBefore(filterComp.getGui(), this.getGui().firstChild);
        })
    }



    private generateTemplate(): string {
        let translate = this.translate.bind(this);

        return `<div>
                    <div class="ag-filter-apply-panel" id="applyPanel">
                        <button type="button" id="clearButton">${translate('clearFilter')}</button>
                        <button type="button" id="applyButton">${translate('applyFilter')}</button>
                    </div>
                </div>`;
    }

    public translate(toTranslate: string): string {
        let translate = this.gridOptionsWrapper.getLocaleTextFunc();
        return translate(toTranslate, DEFAULT_TRANSLATIONS[toTranslate]);
    }


    doesFilterPass(params: IDoesFilterPassParams): boolean {
        return _.every([this.filterComponent1], (filterComp)=>
            filterComp.doesFilterPass(params))
    }

    getModel(): any {
        return this.filterComponent1.getModel();
    }

    public getNullableModel(): M {
        return (<any>this.filterComponent1).serialize ? (<any>this.filterComponent1).serialize() : this.filterComponent1.getModel();
    }

    getModelAsString(model: any): string {
        return "";
    }

    isFilterActive(): boolean {
        return _.every([this.filterComponent1], (filterComp)=>
            filterComp.isFilterActive())
    }

    onFloatingFilterChanged(change: any): void {
        this.filterComponent1.onFloatingFilterChanged (change);
    }

    onNewRowsLoaded(): void {
        if (!this.newRowsActionKeep) {
            this.filterComponent1.setModel (null);
        }
    }

    setModel(model: any): void {
        this.filterComponent1.setModel(null);
    }

    public onClearButton() {
        this.setModel(null);
        this.onFilterChanged();
    }

    private doOnFilterChanged(applyNow: boolean = false): boolean {
        this.filterParams.filterModifiedCallback();
        let requiresApplyAndIsApplying: boolean = this.applyActive && applyNow;
        let notRequiresApply: boolean = !this.applyActive;

        let shouldFilter: boolean = notRequiresApply || requiresApplyAndIsApplying;
        if (shouldFilter) {
            this.filterParams.filterChangedCallback();
        }
        return shouldFilter;
    }

    public onFilterChanged(applyNow: boolean = false): void {
        this.doOnFilterChanged(applyNow);
    }

    onConditionChanged(): void {
        this.onFilterChanged();
    }

}
