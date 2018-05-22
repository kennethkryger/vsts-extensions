import { ErrorKeys, UrlActions } from "BugBashPro/Constants";
import { BugBashDataService } from "BugBashPro/DataServices/BugBashDataService";
import { IBugBash, ISortState } from "BugBashPro/Interfaces";
import { BugBash } from "BugBashPro/ViewModels/BugBash";
import { BaseDataService } from "Common/Services/BaseDataService";
import { ErrorMessageService, ErrorMessageServiceName } from "Common/Services/ErrorMessageService";
import { findIndex } from "Common/Utilities/Array";
import { IAppPageContext, Services } from "Common/Utilities/Context";
import { navigate } from "Common/Utilities/Navigation";
import { stringEquals } from "Common/Utilities/String";
import { IFilterState } from "VSSUI/Utilities/Filter";

export const BugBashServiceName = "BugBashService";

export class BugBashService extends BaseDataService<BugBash[], BugBash, string> {
    private _allLoaded: boolean;
    private _itemsIdMap: IDictionaryStringTo<BugBash>;
    private _filteredItems: BugBash[];
    private _filterState: IFilterState;
    private _sortState: ISortState;
    private _newBugBash: BugBash;
    private _errorMessageService: ErrorMessageService;

    get filterState(): IFilterState {
        return this._filterState;
    }

    get sortState(): ISortState {
        return this._sortState;
    }

    constructor() {
        super();
        this._allLoaded = false;
        this._itemsIdMap = {};
        this._newBugBash = new BugBash();
    }

    public serviceStart(pageContext: IAppPageContext): void {
        super.serviceStart(pageContext);
        this._errorMessageService = pageContext.getService<ErrorMessageService>(ErrorMessageServiceName);
    }

    public isLoaded(key?: string): boolean {
        if (key) {
            return super.isLoaded();
        }

        return this._allLoaded && super.isLoaded();
    }

    public getNewBugBash(): BugBash {
        return this._newBugBash;
    }

    public getItem(id: string): BugBash {
        return this._itemsIdMap[id.toLowerCase()];
    }

    public getFilteredItems(): BugBash[] {
        return this._filteredItems;
    }

    public getKey(): string {
        return BugBashServiceName;
    }

    public fireStoreChange() {
        this._notifyChanged();
    }

    public applyFilter(filterState: IFilterState) {
        this._filterState = filterState;
        this._filteredItems = this._applyFilterAndSort(this.items);
        this.fireStoreChange();
    }

    public clearSortAndFilter() {
        this._filterState = null;
        this._sortState = null;
        this._filteredItems = this.items ? [...this.items] : null;
        this.fireStoreChange();
    }

    public applySort(sortState: ISortState) {
        this._sortState = sortState;
        this._filteredItems = this._applyFilterAndSort(this.items);
        this.fireStoreChange();
    }

    public clean() {
        const items = this.items || [];
        for (const item of items) {
            item.reset(false);
        }

        this._newBugBash.reset(false);

        this._filterState = null;
        this._sortState = null;
        this._filteredItems = this.items ? [...this.items] : null;
        this.fireStoreChange();
    }

    public initializeAllBugBashes() {
        if (this.isLoaded()) {
            this.fireStoreChange();
        }
        else {
            this.refreshAllBugBashes(false);
        }
    }

    public async refreshAllBugBashes(clearError: boolean = true) {
        if (!this.isLoading()) {
            this.setLoading(true);
            const bugBashModels = await BugBashDataService.loadBugBashes();
            this._refreshBugBashes(bugBashModels);
            this._allLoaded = true;
            this.setLoading(false);

            if (clearError) {
                this._errorMessageService.dismissErrorMessage(ErrorKeys.DirectoryPageError);
            }
        }
    }

    public initializeBugBash(bugBashId: string) {
        if (this.isLoaded(bugBashId)) {
            this.fireStoreChange();
        }
        else {
            this.refreshBugBash(bugBashId, false);
        }
    }

    public async refreshBugBash(bugBashId: string, removeUnknownBugBash: boolean = true) {
        if (!this.isLoading(bugBashId)) {
            let error = false;
            this.setLoading(true, bugBashId);
            const bugBashModel = await BugBashDataService.loadBugBash(bugBashId);

            if (bugBashModel && stringEquals(VSS.getWebContext().project.id, bugBashModel.projectId, true)) {
                this._addOrUpdateBugBash(bugBashModel);
                this.setLoading(false, bugBashId);

                this._errorMessageService.dismissErrorMessage(ErrorKeys.BugBashError);
            }
            else if (bugBashModel && !stringEquals(VSS.getWebContext().project.id, bugBashModel.projectId, true)) {
                this.setLoading(false, bugBashId);
                this._errorMessageService.showErrorMessage(`Bug Bash "${bugBashId}" is out of scope of current project.`, ErrorKeys.DirectoryPageError);
                error = true;
            }
            else {
                if (removeUnknownBugBash) {
                    this._removeBugBash(bugBashId);
                }

                this.setLoading(false, bugBashId);
                this._errorMessageService.showErrorMessage(`Bug Bash "${bugBashId}" does not exist.`, ErrorKeys.DirectoryPageError);
                error = true;
            }

            if (error) {
                navigate({ view: UrlActions.ACTION_ALL }, true);
            }
        }
    }

    public async updateBugBash(bugBashModel: IBugBash) {
        if (!this.isLoading(bugBashModel.id)) {
            this.setLoading(true, bugBashModel.id);

            try {
                const updatedBugBashModel = await BugBashDataService.updateBugBash(bugBashModel);
                this._addOrUpdateBugBash(updatedBugBashModel);
                this.setLoading(false, bugBashModel.id);

                this._errorMessageService.dismissErrorMessage(ErrorKeys.BugBashError);
            }
            catch (e) {
                this.setLoading(false, bugBashModel.id);
                this._errorMessageService.showErrorMessage(e, ErrorKeys.DirectoryPageError);
            }
        }
    }

    public async createBugBash(bugBashModel: IBugBash) {
        if (!this.isLoading()) {
            this.setLoading(true);

            try {
                const createdBugBashModel = await BugBashDataService.createBugBash(bugBashModel);

                this._newBugBash.reset(false);
                this._addOrUpdateBugBash(createdBugBashModel);
                this.setLoading(false);

                this._errorMessageService.dismissErrorMessage(ErrorKeys.BugBashError);

                navigate({ view: UrlActions.ACTION_EDIT, id: createdBugBashModel.id }, true);
            }
            catch (e) {
                this.setLoading(false);
                this._errorMessageService.showErrorMessage(e, ErrorKeys.BugBashError);
            }
        }
    }

    public async deleteBugBash(bugBashId: string) {
        if (!this.isLoading(bugBashId)) {
            this.setLoading(true, bugBashId);

            await BugBashDataService.deleteBugBash(bugBashId);
            this._removeBugBash(bugBashId);
            this.setLoading(false, bugBashId);
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _applyFilterAndSort(bugBashes: BugBash[]): BugBash[] {
        if (bugBashes == null) {
            return null;
        }

        let filteredItems = [...bugBashes];
        if (this._filterState) {
            filteredItems = this.items.filter(b => b.matches(this._filterState));
        }

        if (this._sortState) {
            filteredItems.sort((b1, b2) => BugBash.compare(b1, b2, this._sortState));
        }

        return filteredItems;
    }

    private _refreshBugBashes(bugBashModels: IBugBash[]) {
        if (!bugBashModels) {
            return;
        }

        this.items = [];
        this._filteredItems = [];
        this._itemsIdMap = {};

        for (const bugBashModel of bugBashModels) {
            const bugBash = new BugBash(bugBashModel);
            this.items.push(bugBash);
            this._itemsIdMap[bugBashModel.id.toLowerCase()] = bugBash;
        }

        this._filteredItems = this._applyFilterAndSort(this.items);
    }

    private _addOrUpdateBugBash(bugBashModel: IBugBash) {
        if (!bugBashModel) {
            return;
        }

        if (this.items == null) {
            this.items = [];
        }
        if (this._itemsIdMap == null) {
            this._itemsIdMap = {};
        }

        const bugBash = new BugBash(bugBashModel);
        this._itemsIdMap[bugBashModel.id.toLowerCase()] = bugBash;

        // add in all items
        const existingIndex = findIndex(this.items, (existingBugBash: BugBash) => stringEquals(bugBashModel.id, existingBugBash.id, true));
        if (existingIndex !== -1) {
            this.items[existingIndex] = bugBash;
        }
        else {
            this.items.push(bugBash);
        }

        this._filteredItems = this._applyFilterAndSort(this.items);
    }

    private _removeBugBash(bugBashId: string) {
        if (!bugBashId || this.items == null || this.items.length === 0) {
            return;
        }

        delete this._itemsIdMap[bugBashId.toLowerCase()];

        // remove from all items
        let existingIndex = findIndex(this.items, (existingBugBash: BugBash) => stringEquals(bugBashId, existingBugBash.id, true));
        if (existingIndex !== -1) {
            this.items.splice(existingIndex, 1);
        }

        // remove from filtered items
        existingIndex = findIndex(this._filteredItems || [], (existingBugBash: BugBash) => stringEquals(bugBashId, existingBugBash.id, true));
        if (existingIndex !== -1) {
            this._filteredItems.splice(existingIndex, 1);
        }
    }
}

Services.add(BugBashServiceName, { serviceFactory: BugBashService });
