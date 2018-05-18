import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { localeIgnoreCaseComparer } from "Common/Utilities/String";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export const WorkItemRelationTypeServiceName = "WorkItemRelationTypeService";

export class WorkItemRelationTypeService extends BaseDataService<WorkItemRelationType[], WorkItemRelationType, string> {
    private _itemsRefNameMap: IDictionaryStringTo<WorkItemRelationType>;
    private _itemsNameMap: IDictionaryStringTo<WorkItemRelationType>;

    constructor() {
        super();
        this._itemsRefNameMap = {};
        this._itemsNameMap = {};
    }

    public getItem(relationTypeRefName: string): WorkItemRelationType {
        const key = (relationTypeRefName || "").toLowerCase();
        return this._itemsRefNameMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return WorkItemRelationTypeServiceName;
    }

    public async initializeWorkItemRelationTypes() {
        if (this.isLoaded()) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);
            try {
                const workItemRelationTypes = await WitClient.getClient().getRelationTypes();
                workItemRelationTypes.sort((a: WorkItemRelationType, b: WorkItemRelationType) => localeIgnoreCaseComparer(a.name, b.name));
                this._populateRelationTypes(workItemRelationTypes);
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

    private _populateRelationTypes(workItemRelationTypes: WorkItemRelationType[]) {
        if (workItemRelationTypes) {
            this.items = workItemRelationTypes;
            this._itemsRefNameMap = {};
            this._itemsNameMap = {};

            for (const item of this.items) {
                this._itemsRefNameMap[item.referenceName.toLowerCase()] = item;
                this._itemsNameMap[item.name.toLowerCase()] = item;
            }
        }

        this.setLoading(false);
    }
}

Services.add(WorkItemRelationTypeServiceName, { serviceFactory: WorkItemRelationTypeService });
