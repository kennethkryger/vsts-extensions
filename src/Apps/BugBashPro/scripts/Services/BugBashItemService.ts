import {
    BugBashFieldNames, BugBashItemFieldNames, ErrorKeys, WorkItemFieldNames
} from "BugBashPro/Constants";
import { BugBashItemDataService } from "BugBashPro/DataServices/BugBashItemDataService";
import { IBugBashItem, ISortState } from "BugBashPro/Interfaces";
import {
    BugBashItemCommentService, BugBashItemCommentServiceName
} from "BugBashPro/Services/BugBashItemCommentService";
import { BugBashService, BugBashServiceName } from "BugBashPro/Services/BugBashService";
import { BugBashItem } from "BugBashPro/ViewModels/BugBashItem";
import { BaseDataService } from "Common/Services/BaseDataService";
import { ErrorMessageService, ErrorMessageServiceName } from "Common/Services/ErrorMessageService";
import { findIndex } from "Common/Utilities/Array";
import { IAppPageContext, Services } from "Common/Utilities/Context";
import { getDistinctNameFromIdentityRef } from "Common/Utilities/Identity";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { IdentityRef } from "VSS/WebApi/Contracts";
import { IFilterState } from "VSSUI/Utilities/Filter";

export const BugBashItemServiceName = "BugBashItemService";

export class BugBashItemService extends BaseDataService<BugBashItem[], BugBashItem, string, string> {
    private _itemsIdMap: IDictionaryStringTo<BugBashItem>;
    private _filteredItems: BugBashItem[];
    private _newBugBashItem: BugBashItem;
    private _filterState: IFilterState;
    private _sortState: ISortState;
    private _propertyMap: IDictionaryStringTo<IDictionaryStringTo<number>>;
    private _defaultTeamId: string;
    private _errorMessageService: ErrorMessageService;
    private _bugBashService: BugBashService;
    private _bugBashItemCommentService: BugBashItemCommentService;

    get filterState(): IFilterState {
        return this._filterState;
    }

    get sortState(): ISortState {
        return this._sortState;
    }

    get propertyMap(): IDictionaryStringTo<IDictionaryStringTo<number>> {
        return this._propertyMap;
    }

    constructor() {
        super();
        this._itemsIdMap = {};
        this._propertyMap = {
            [BugBashItemFieldNames.TeamId]: {},
            [BugBashItemFieldNames.CreatedBy]: {},
            [BugBashItemFieldNames.RejectedBy]: {},
            [WorkItemFieldNames.AreaPath]: {},
            [WorkItemFieldNames.AssignedTo]: {},
            [WorkItemFieldNames.State]: {}
        };
        this._newBugBashItem = new BugBashItem();
    }

    public serviceStart(pageContext: IAppPageContext): void {
        super.serviceStart(pageContext);
        this._errorMessageService = pageContext.getService<ErrorMessageService>(ErrorMessageServiceName);
        this._bugBashService = pageContext.getService<BugBashService>(BugBashServiceName);
        this._bugBashItemCommentService = pageContext.getService<BugBashItemCommentService>(BugBashItemCommentServiceName);
    }

    public getNewBugBashItem(): BugBashItem {
        return this._newBugBashItem;
    }

    public getItem(bugBashItemId: string): BugBashItem {
         return this._itemsIdMap[bugBashItemId.toLowerCase()];
    }

    public getFilteredItems(): BugBashItem[] {
        return this._filteredItems;
    }

    public getKey(): string {
        return "BugBashItemStore";
    }

    public setDefaultTeam(teamId: string) {
        this._defaultTeamId = teamId;
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

        this._filterState = null;
        this._sortState = null;
        this._filteredItems = null;
        this.items = null;
        this._itemsIdMap = {};
        this._refreshPropertyMap();
        this.fireStoreChange();
    }

    public initializeItems(bugBashId: string) {
        if (this.isLoaded()) {
            this.fireStoreChange();
        }
        else {
            this.refreshItems(bugBashId, false);
        }
    }

    public async refreshItems(bugBashId: string, cleanErrorAndComments: boolean = true) {
        if (!this.isLoading()) {
            if (this._bugBashService.itemExists(bugBashId)) {
                const defaultTeam = this._bugBashService.getItem(bugBashId).getFieldValue<string>(BugBashFieldNames.DefaultTeam, true);
                this.setDefaultTeam(defaultTeam);
            }

            this.setLoading(true);

            const bugBashItemModels = await BugBashItemDataService.loadBugBashItems(bugBashId);

            if (bugBashItemModels) {
                this._newBugBashItem = new BugBashItem(BugBashItem.getNewBugBashItemModel(null, this._defaultTeamId));
            }
            this._refreshBugBashItems(bugBashItemModels);
            this.setLoading(false);

            if (cleanErrorAndComments) {
                this._errorMessageService.dismissErrorMessage(ErrorKeys.BugBashItemError);

                // clear all comments
                this._bugBashItemCommentService.clean();
            }
        }
    }

    public async refreshItem(bugBashId: string, bugBashItemId: string) {
        if (!this.isLoading(bugBashItemId)) {
            this.setLoading(true, bugBashItemId);

            try {
                const bugBashItemModel = await BugBashItemDataService.loadBugBashItem(bugBashId, bugBashItemId);
                this._addOrUpdateBugBashItem(bugBashItemModel);
                this.setLoading(false, bugBashItemId);

                this._errorMessageService.dismissErrorMessage(ErrorKeys.BugBashItemError);

                // refresh comments for this bug bash item
                if (bugBashItemModel.workItemId <= 0 || bugBashItemModel.workItemId == null) {
                    this._bugBashItemCommentService.refreshComments(bugBashItemId);
                }
            }
            catch (e) {
                this.setLoading(false, bugBashItemId);
                this._errorMessageService.showErrorMessage(e, ErrorKeys.BugBashItemError);
            }
        }
    }

    public async updateBugBashItem(bugBashId: string, bugBashItemModel: IBugBashItem, newComment?: string) {
        if (!this.isLoading(bugBashItemModel.id)) {
            this.setLoading(true, bugBashItemModel.id);

            try {
                const updatedBugBashItemModel = await BugBashItemDataService.updateBugBashItem(bugBashId, bugBashItemModel);
                if (!isNullOrWhiteSpace(newComment)) {
                    this._bugBashItemCommentService.createComment(updatedBugBashItemModel.id, newComment);
                }

                this._addOrUpdateBugBashItem(updatedBugBashItemModel);
                this._setSelectedItem(updatedBugBashItemModel.id);
                this.setLoading(false, bugBashItemModel.id);
                this._errorMessageService.dismissErrorMessage(ErrorKeys.BugBashItemError);
            }
            catch (e) {
                this.setLoading(false, bugBashItemModel.id);
                this._errorMessageService.showErrorMessage(e, ErrorKeys.BugBashItemError);
            }
        }
    }

    public async createBugBashItem(bugBashId: string, bugBashItemModel: IBugBashItem, newComment?: string) {
        if (!this.isLoading()) {
            try {
                const createdBugBashItemModel = await BugBashItemDataService.createBugBashItem(bugBashId, bugBashItemModel, newComment);
                if (!isNullOrWhiteSpace(newComment) && !createdBugBashItemModel.workItemId) {
                    this._bugBashItemCommentService.createComment(createdBugBashItemModel.id, newComment);
                }

                this._newBugBashItem.reset(false);
                this._addOrUpdateBugBashItem(createdBugBashItemModel);
                this._setSelectedItem(createdBugBashItemModel.id);
                this._errorMessageService.dismissErrorMessage(ErrorKeys.BugBashItemError);
            }
            catch (e) {
                this._errorMessageService.showErrorMessage(e, ErrorKeys.BugBashItemError);
            }
        }
    }

    public async deleteBugBashItem(bugBashId: string, bugBashItemId: string) {
        if (!this.isLoading(bugBashItemId)) {
            this.setLoading(true, bugBashItemId);

            await BugBashItemDataService.deleteBugBashItem(bugBashId, bugBashItemId);
            this._removeBugBashItem(bugBashItemId);
            this.setLoading(false, bugBashItemId);
        }
    }

    public async acceptBugBashItem(bugBashItemModel: IBugBashItem) {
        if (!this.isLoading(bugBashItemModel.id)) {
            this.setLoading(true, bugBashItemModel.id);

            try {
                const acceptedBugBashItemModel = await BugBashItemDataService.acceptItem(bugBashItemModel);
                this._addOrUpdateBugBashItem(acceptedBugBashItemModel);
                this.setLoading(false, bugBashItemModel.id);

                this._setSelectedItem(acceptedBugBashItemModel.id);
                this._errorMessageService.dismissErrorMessage(ErrorKeys.BugBashItemError);
            }
            catch (e) {
                this.setLoading(false, bugBashItemModel.id);
                this._errorMessageService.showErrorMessage(e, ErrorKeys.BugBashItemError);
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _setSelectedItem(bugBashItemId: string) {
        this.notify(bugBashItemId, "selectionChanged");
    }

    private _applyFilterAndSort(bugBashItems: BugBashItem[]): BugBashItem[] {
        if (bugBashItems == null) {
            return null;
        }

        let filteredItems = [...bugBashItems];
        if (this._filterState) {
            filteredItems = this.items.filter(b => b.matches(this._filterState));
        }

        if (this._sortState) {
            filteredItems.sort((b1, b2) => BugBashItem.compare(b1, b2, this._sortState));
        }

        return filteredItems;
    }

    private _refreshBugBashItems(bugBashItemModels: IBugBashItem[]) {
        if (!bugBashItemModels) {
            return;
        }

        this.items = [];
        this._filteredItems = [];
        this._itemsIdMap = {};

        for (const bugBashItemModel of bugBashItemModels) {
            const bugBashItem = new BugBashItem(bugBashItemModel);
            this.items.push(bugBashItem);
            this._itemsIdMap[bugBashItemModel.id.toLowerCase()] = bugBashItem;
        }

        this._filteredItems = this._applyFilterAndSort(this.items);
        this._refreshPropertyMap();
    }

    private _addOrUpdateBugBashItem(bugBashItemModel: IBugBashItem): void {
        if (!bugBashItemModel) {
            return;
        }

        if (this.items == null) {
            this.items = [];
        }
        if (this._itemsIdMap == null) {
            this._itemsIdMap = {};
        }

        const bugBashItem = new BugBashItem(bugBashItemModel);
        this._itemsIdMap[bugBashItemModel.id.toLowerCase()] = bugBashItem;

        // add in all items
        const existingIndex = findIndex(this.items, (existingBugBashItem: BugBashItem) => stringEquals(bugBashItemModel.id, existingBugBashItem.id, true));
        if (existingIndex !== -1) {
            this.items[existingIndex] = bugBashItem;
        }
        else {
            this.items.push(bugBashItem);
        }

        this._filteredItems = this._applyFilterAndSort(this.items);
        this._refreshPropertyMap();
    }

    private _removeBugBashItem(bugBashItemId: string): void {
        if (!bugBashItemId || this.items == null || this.items.length === 0) {
            return;
        }

        if (this._itemsIdMap != null) {
            delete this._itemsIdMap[bugBashItemId.toLowerCase()];
        }

        // remove from all items
        let existingIndex = findIndex(this.items, (existingBugBashItem: BugBashItem) => stringEquals(bugBashItemId, existingBugBashItem.id, true));
        if (existingIndex !== -1) {
            this.items.splice(existingIndex, 1);
        }

        // remove from filtered items
        existingIndex = findIndex(this._filteredItems || [], (existingBugBashItem: BugBashItem) => stringEquals(bugBashItemId, existingBugBashItem.id, true));
        if (existingIndex !== -1) {
            this._filteredItems.splice(existingIndex, 1);
        }

        this._refreshPropertyMap();
    }

    private _refreshPropertyMap() {
        this._propertyMap = {
            [BugBashItemFieldNames.TeamId]: {},
            [BugBashItemFieldNames.CreatedBy]: {},
            [BugBashItemFieldNames.RejectedBy]: {},
            [WorkItemFieldNames.AreaPath]: {},
            [WorkItemFieldNames.AssignedTo]: {},
            [WorkItemFieldNames.State]: {}
        };

        if (!this.items) {
            return;
        }

        for (const bugBashItem of this.items) {
            if (!bugBashItem.isAccepted) {
                const teamId = bugBashItem.getFieldValue<string>(BugBashItemFieldNames.TeamId, true);
                const createdBy = bugBashItem.getFieldValue<IdentityRef>(BugBashItemFieldNames.CreatedBy, true);
                const createdByStr = getDistinctNameFromIdentityRef(createdBy);

                this._propertyMap[BugBashItemFieldNames.TeamId][teamId] = (this._propertyMap[BugBashItemFieldNames.TeamId][teamId] || 0) + 1;
                this._propertyMap[BugBashItemFieldNames.CreatedBy][createdByStr] = (this._propertyMap[BugBashItemFieldNames.CreatedBy][createdByStr] || 0) + 1;

                if (bugBashItem.isRejected) {
                    const rejectedBy = bugBashItem.getFieldValue<IdentityRef>(BugBashItemFieldNames.RejectedBy, true);
                    const rejectedByStr = getDistinctNameFromIdentityRef(rejectedBy);
                    this._propertyMap[BugBashItemFieldNames.RejectedBy][rejectedByStr] = (this._propertyMap[BugBashItemFieldNames.RejectedBy][rejectedByStr] || 0) + 1;
                }
            }
            else {
                const workItem = bugBashItem.workItem;
                const areaPath = workItem.fields[WorkItemFieldNames.AreaPath];
                const assignedTo = workItem.fields[WorkItemFieldNames.AssignedTo] || "Unassigned";
                const state = workItem.fields[WorkItemFieldNames.State];
                const itemCreatedBy = bugBashItem.getFieldValue<IdentityRef>(BugBashItemFieldNames.CreatedBy, true);
                const itemCreatedByStr = getDistinctNameFromIdentityRef(itemCreatedBy);

                this._propertyMap[BugBashItemFieldNames.CreatedBy][itemCreatedByStr] = (this._propertyMap[BugBashItemFieldNames.CreatedBy][itemCreatedByStr] || 0) + 1;
                this._propertyMap[WorkItemFieldNames.AreaPath][areaPath] = (this._propertyMap[WorkItemFieldNames.AreaPath][areaPath] || 0) + 1;
                this._propertyMap[WorkItemFieldNames.State][state] = (this._propertyMap[WorkItemFieldNames.State][state] || 0) + 1;
                this._propertyMap[WorkItemFieldNames.AssignedTo][assignedTo] = (this._propertyMap[WorkItemFieldNames.AssignedTo][assignedTo] || 0) + 1;
            }
        }
    }
}

Services.add(BugBashItemServiceName, { serviceFactory: BugBashItemService });
