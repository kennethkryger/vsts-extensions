import { IActionsCreator } from "Library/Flux/Action";
import { WorkItemActionsHub, WorkItemStore } from "Library/Flux/WorkItem";
import { WorkItem, WorkItemErrorPolicy } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { JsonPatchDocument, JsonPatchOperation, Operation } from "VSS/WebApi/Contracts";

export class WorkItemActionsCreator implements IActionsCreator {
    constructor(private _actionsHub: WorkItemActionsHub, private _workItemStore: WorkItemStore) {}

    public async initializeWorkItems(ids: number[]) {
        if (!ids || ids.length === 0) {
            this._actionsHub.AddOrUpdateWorkItems.invoke(null);
        }
        else if (!this._workItemStore.isLoading()) {
            const idsToFetch: number[] = [];
            for (const id of ids) {
                if (!this._workItemStore.isLoaded(id)) {
                    idsToFetch.push(id);
                }
            }

            if (idsToFetch.length === 0) {
                this._actionsHub.AddOrUpdateWorkItems.invoke(null);
                return;
            }

            this._workItemStore.setLoading(true);

            try {
                const workItems = await this._getWorkItems(idsToFetch);

                this._actionsHub.AddOrUpdateWorkItems.invoke(workItems);
                this._workItemStore.setLoading(false);
            }
            catch (e) {
                this._workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    public async refreshWorkItems(ids: number[]) {
        if (!ids || ids.length === 0) {
            this._actionsHub.AddOrUpdateWorkItems.invoke(null);
        }
        else if (!this._workItemStore.isLoading()) {
            this._workItemStore.setLoading(true);

            try {
                const workItems = await this._getWorkItems(ids);
                this._actionsHub.AddOrUpdateWorkItems.invoke(workItems);
                this._workItemStore.setLoading(false);
            }
            catch (e) {
                this._workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    public async initializeWorkItem(id: number) {
        if (!this._workItemStore.isLoaded(id)) {
            this._actionsHub.AddOrUpdateWorkItems.invoke(null);
        }
        else if (!this._workItemStore.isLoading()) {
            this._workItemStore.setLoading(true);

            try {
                const workItem = await WitClient.getClient().getWorkItem(id);
                this._actionsHub.AddOrUpdateWorkItems.invoke([workItem]);
                this._workItemStore.setLoading(false);
            }
            catch (e) {
                this._workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    public async refreshWorkItem(id: number) {
        if (!this._workItemStore.isLoading()) {
            this._workItemStore.setLoading(true);

            try {
                const workItem = await WitClient.getClient().getWorkItem(id);
                this._actionsHub.AddOrUpdateWorkItems.invoke([workItem]);
                this._workItemStore.setLoading(false);
            }
            catch (e) {
                this._workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    public async createWorkItem(workItemType: string, fieldValues: IDictionaryStringTo<string>, projectId?: string): Promise<WorkItem> {
        if (!this._workItemStore.isLoading()) {
            this._workItemStore.setLoading(true);

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
                this._actionsHub.AddOrUpdateWorkItems.invoke([workItem]);
                this._workItemStore.setLoading(false);
                return workItem;
            }
            catch (e) {
                this._workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    public async updateWorkItem(workItemId: number, fieldValues: IDictionaryStringTo<string>): Promise<WorkItem> {
        if (!this._workItemStore.isLoading()) {
            this._workItemStore.setLoading(true);

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
                this._actionsHub.AddOrUpdateWorkItems.invoke([workItem]);
                this._workItemStore.setLoading(false);
                return workItem;
            }
            catch (e) {
                this._workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    public async deleteWorkItem(workItemId: number, projectId?: string, destroy?: boolean): Promise<void> {
        if (!this._workItemStore.isLoading()) {
            this._workItemStore.setLoading(true);

            try {
                await WitClient.getClient().deleteWorkItem(workItemId, projectId, destroy);
                this._actionsHub.DeleteWorkItems.invoke([workItemId]);
                this._workItemStore.setLoading(false);
            }
            catch (e) {
                this._workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    public refreshWorkItemInStore(workItems: WorkItem[]) {
        this._actionsHub.AddOrUpdateWorkItems.invoke(workItems);
    }

    public clearWorkItemsCache() {
        this._actionsHub.ClearWorkItems.invoke(null);
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
}
