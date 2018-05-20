import { BaseDataService } from "Common/Services/BaseDataService";
import { findIndex } from "Common/Utilities/Array";
import { Services } from "Common/Utilities/Context";
import { workItemComparer, workItemMatchesFilter } from "RelatedWits/Helpers";
import { Constants, ISortState, WorkItemFieldNames } from "RelatedWits/Models";
import { WorkItem, WorkItemErrorPolicy } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { IFilterState } from "VSSUI/Utilities/Filter";

export const RelatedWorkItemsServiceName = "RelatedWorkItemsService";

export class RelatedWorkItemsService extends BaseDataService<WorkItem[], WorkItem, number> {
    private _filteredItems: WorkItem[];
    private _filterState: IFilterState;
    private _sortState: ISortState;
    private _propertyMap: IDictionaryStringTo<IDictionaryStringTo<number>>;

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
        this._propertyMap = {
            [WorkItemFieldNames.AreaPath]: {},
            [WorkItemFieldNames.WorkItemType]: {},
            [WorkItemFieldNames.AssignedTo]: {},
            [WorkItemFieldNames.State]: {}
        };
    }

    public getItem(id: number): WorkItem {
        if (this.items) {
            const index = findIndex(this.items, w => w.id === id);
            return index !== -1 ? this.items[index] : null;
        }
        return null;
    }

    public getFilteredItems(): WorkItem[] {
        return this._filteredItems;
    }

    public getKey(): string {
        return RelatedWorkItemsServiceName;
    }

    public applyFilter(filterState: IFilterState) {
        this._filterState = filterState;
        this._filteredItems = this._applyFilterAndSort(this.items);
        this._notifyChanged();
    }

    public clearSortAndFilter() {
        this._filterState = null;
        this._sortState = null;
        this._filteredItems = this.items ? [...this.items] : null;
        this._notifyChanged();
    }

    public applySort(sortState: ISortState) {
        this._sortState = sortState;
        this._filteredItems = this._applyFilterAndSort(this.items);
        this._notifyChanged();
    }

    public clean() {
        this._filterState = null;
        this._sortState = null;
        this._filteredItems = null;
        this.items = null;
        this._refreshPropertyMap();
        this._notifyChanged();
    }

    public updateWorkItemInStore(workItem: WorkItem) {
        if (workItem) {
            const index = findIndex(this.items, w => w.id === workItem.id);
            if (index !== -1) {
                this.items[index] = workItem;
                this._filteredItems = this._applyFilterAndSort(this.items);
                this._refreshPropertyMap();
            }
        }

        this._notifyChanged();
    }

    public async refresh(query: {project: string, wiql: string}, top: number) {
        if (!this.isLoading()) {
            this.setLoading(true);

            let workItems: WorkItem[];
            const queryResult = await WitClient.getClient().queryByWiql({query: query.wiql}, query.project, null, false, top);
            if (queryResult.workItems && queryResult.workItems.length > 0) {
                workItems = await WitClient.getClient().getWorkItems(
                    queryResult.workItems.map(w => w.id),
                    Constants.DEFAULT_FIELDS_TO_RETRIEVE,
                    null,
                    null,
                    WorkItemErrorPolicy.Omit);
            }
            else {
                workItems = [];
            }

            this._refreshWorkItems(workItems);
            this.setLoading(false);
        }
    }

    protected convertItemKeyToString(key: number): string {
        return key.toString();
    }

    private _applyFilterAndSort(workItems: WorkItem[]): WorkItem[] {
        if (workItems == null) {
            return null;
        }

        let filteredItems = [...workItems];
        if (this._filterState) {
            filteredItems = this.items.filter(w => workItemMatchesFilter(w, this._filterState));
        }

        if (this._sortState) {
            filteredItems.sort((w1, w2) => workItemComparer(w1, w2, this._sortState));
        }

        return filteredItems;
    }

    private _refreshWorkItems(workItems: WorkItem[]) {
        if (!workItems) {
            return;
        }

        this.items = workItems;
        this._filteredItems = this._applyFilterAndSort(this.items);
        this._refreshPropertyMap();
    }

    private _refreshPropertyMap() {
        this._propertyMap = {
            [WorkItemFieldNames.AreaPath]: {},
            [WorkItemFieldNames.WorkItemType]: {},
            [WorkItemFieldNames.AssignedTo]: {},
            [WorkItemFieldNames.State]: {}
        };

        if (!this.items) {
            return;
        }

        for (const workItem of this.items) {
            const areaPath = workItem.fields[WorkItemFieldNames.AreaPath];
            const workItemType = workItem.fields[WorkItemFieldNames.WorkItemType];
            const assignedTo = workItem.fields[WorkItemFieldNames.AssignedTo] || "Unassigned";
            const state = workItem.fields[WorkItemFieldNames.State];

            this._propertyMap[WorkItemFieldNames.WorkItemType][workItemType] = (this._propertyMap[WorkItemFieldNames.WorkItemType][workItemType] || 0) + 1;
            this._propertyMap[WorkItemFieldNames.AreaPath][areaPath] = (this._propertyMap[WorkItemFieldNames.AreaPath][areaPath] || 0) + 1;
            this._propertyMap[WorkItemFieldNames.State][state] = (this._propertyMap[WorkItemFieldNames.State][state] || 0) + 1;
            this._propertyMap[WorkItemFieldNames.AssignedTo][assignedTo] = (this._propertyMap[WorkItemFieldNames.AssignedTo][assignedTo] || 0) + 1;
        }
    }
}

Services.add(RelatedWorkItemsServiceName, { serviceFactory: RelatedWorkItemsService });
