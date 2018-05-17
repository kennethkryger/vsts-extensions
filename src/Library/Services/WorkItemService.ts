import { BaseDataService } from "Library/Services/BaseDataService";
import { Services } from "Library/Utilities/Context";
import { WorkItem, WorkItemErrorPolicy } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { JsonPatchDocument, JsonPatchOperation, Operation } from "VSS/WebApi/Contracts";

export const WorkItemServiceName = "WorkItemService";

export class WorkItemService extends BaseDataService<IDictionaryNumberTo<WorkItem>, WorkItem, number> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(workItemId: number): WorkItem {
         return this.items[workItemId];
    }

    public getItems(workItemIds: number[]): WorkItem[] {
        const workItems: WorkItem[] = [];
        for (const workItemId of workItemIds) {
            if (this.items[workItemId]) {
                workItems.push(this.items[workItemId]);
            }
        }

        return workItems;
    }

    public getKey(): string {
        return WorkItemServiceName;
    }

    public clearStore() {
        this.items = {};
    }

    public async initializeWorkItems(ids: number[]) {
        if (!ids || ids.length === 0) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            const idsToFetch: number[] = [];
            for (const id of ids) {
                if (!this.isLoaded(id)) {
                    idsToFetch.push(id);
                }
            }

            if (idsToFetch.length === 0) {
                this._notifyChanged();
                return;
            }

            this.setLoading(true);

            try {
                const workItems = await this._getWorkItems(idsToFetch);
                this._addOrUpdateWorkItems(workItems);
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    public async refreshWorkItems(ids: number[]) {
        if (!ids || ids.length === 0) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);

            try {
                const workItems = await this._getWorkItems(ids);
                this._addOrUpdateWorkItems(workItems);
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    public async initializeWorkItem(id: number) {
        if (!this.isLoaded(id)) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);

            try {
                const workItem = await WitClient.getClient().getWorkItem(id);
                this._addOrUpdateWorkItems([workItem]);
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    public async refreshWorkItem(id: number) {
        if (!this.isLoading()) {
            this.setLoading(true);

            try {
                const workItem = await WitClient.getClient().getWorkItem(id);
                this._addOrUpdateWorkItems([workItem]);
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    public async createWorkItem(workItemType: string, fieldValues: IDictionaryStringTo<string>, projectId?: string): Promise<WorkItem> {
        if (!this.isLoading()) {
            this.setLoading(true);

            const patchDocument: JsonPatchDocument & JsonPatchOperation[] = [];
            for (const fieldRefName of Object.keys(fieldValues)) {
                patchDocument.push({
                    op: Operation.Add,
                    path: `/fields/${fieldRefName}`,
                    value: fieldValues[fieldRefName]
                } as JsonPatchOperation);
            }

            try {
                const workItem = await WitClient.getClient().createWorkItem(patchDocument, projectId || VSS.getWebContext().project.id, workItemType);
                this._addOrUpdateWorkItems([workItem]);
                return workItem;
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    public async updateWorkItem(workItemId: number, fieldValues: IDictionaryStringTo<string>): Promise<WorkItem> {
        if (!this.isLoading()) {
            this.setLoading(true);

            const patchDocument: JsonPatchDocument & JsonPatchOperation[] = [];
            for (const fieldRefName of Object.keys(fieldValues)) {
                patchDocument.push({
                    op: Operation.Add,
                    path: `/fields/${fieldRefName}`,
                    value: fieldValues[fieldRefName]
                } as JsonPatchOperation);
            }

            try {
                const workItem = await WitClient.getClient().updateWorkItem(patchDocument, workItemId);
                this._addOrUpdateWorkItems([workItem]);
                return workItem;
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    public async deleteWorkItem(workItemId: number, projectId?: string, destroy?: boolean): Promise<void> {
        if (!this.isLoading()) {
            this.setLoading(true);

            try {
                await WitClient.getClient().deleteWorkItem(workItemId, projectId, destroy);
                this._deleteWorkItems([workItemId]);
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    public refreshWorkItemInStore(workItems: WorkItem[]) {
        this._addOrUpdateWorkItems(workItems);
    }

    public clearWorkItemsCache() {
        this.clearStore();
        this._notifyChanged();
    }

    protected convertItemKeyToString(key: number): string {
        return `${key}`;
    }

    private _addOrUpdateWorkItems(workItems: WorkItem[]) {
        if (workItems) {
            for (const workItem of workItems) {
                this._addWorkItem(workItem);
            }
        }

        this.setLoading(false);
    }

    private _deleteWorkItems(workItemIds: number[]) {
        if (workItemIds) {
            for (const id of workItemIds) {
                this._removeWorkItem(id);
            }
        }

        this.setLoading(false);
    }

    private async _getWorkItems(ids: number[]): Promise<WorkItem[]> {
        const cloneIds = [...ids];
        const idsToFetch: number[][] = [];
        let i = 0;
        while (cloneIds.length > 0) {
            idsToFetch[i] = cloneIds.splice(0, 100);
            i++;
        }

        const promises = idsToFetch.map(witIds => WitClient.getClient().getWorkItems(witIds, null, null, null, WorkItemErrorPolicy.Omit));
        const workItemArrays: WorkItem[][] = await Promise.all(promises);
        const finalResult: WorkItem[] = [];
        for (const workItemArray of workItemArrays) {
            finalResult.push(...workItemArray);
        }

        return this._filterNullWorkItems(finalResult, ids);
    }

    private _filterNullWorkItems(workItems: WorkItem[], idsToFetch: number[]): WorkItem[] {
        const workItemsMap = {};
        for (const workItem of workItems) {
            if (workItem) {
                workItemsMap[workItem.id] = workItem;
            }
        }

        const filteredWorkItems: WorkItem[] = [];
        for (const witId of idsToFetch) {
            if (!workItemsMap[witId]) {
                filteredWorkItems.push({
                    id: witId,
                    fields: {},
                    relations: [],
                    rev: -1,
                    _links: null,
                    url: null
                });
            }
            else {
                filteredWorkItems.push(workItemsMap[witId]);
            }
        }

        return filteredWorkItems;
    }

    private _addWorkItem(workItem: WorkItem): void {
        if (!workItem) {
            return;
        }
        this.items[workItem.id] = workItem;
    }

    private _removeWorkItem(workItemId: number): void {
        delete this.items[workItemId];
    }
}

Services.add(WorkItemServiceName, { serviceFactory: WorkItemService });
