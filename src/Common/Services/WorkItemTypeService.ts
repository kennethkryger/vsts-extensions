import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { localeIgnoreCaseComparer } from "Common/Utilities/String";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export const WorkItemTypeServiceName = "WorkItemTypeService";

export class WorkItemTypeService extends BaseDataService<WorkItemType[], WorkItemType, string> {
    private _itemsIdMap: IDictionaryStringTo<WorkItemType>;

    constructor() {
        super();
        this._itemsIdMap = {};
    }

    public getItem(typeName: string): WorkItemType {
        const key = (typeName || "").toLowerCase();
        return this._itemsIdMap[key];
    }

    public getKey(): string {
        return WorkItemTypeServiceName;
    }

    public async initializeWorkItemTypes() {
        if (this.isLoaded()) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);
            try {
                const workItemTypes = await WitClient.getClient().getWorkItemTypes(VSS.getWebContext().project.id);
                workItemTypes.sort((a: WorkItemType, b: WorkItemType) => localeIgnoreCaseComparer(a.name, b.name));
                this._populateWorkItemTypes(workItemTypes);
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _populateWorkItemTypes(workItemTypes: WorkItemType[]) {
        if (workItemTypes) {
            this.items = workItemTypes;
            this._itemsIdMap = {};

            for (const item of this.items) {
                this._itemsIdMap[item.name.toLowerCase()] = item;
            }
        }

        this.setLoading(false);
    }
}

Services.add(WorkItemTypeServiceName, { serviceFactory: WorkItemTypeService });
