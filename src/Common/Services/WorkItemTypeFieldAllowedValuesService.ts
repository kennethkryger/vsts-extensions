import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { WorkItemTypeFieldsExpandLevel } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export const WorkItemTypeFieldAllowedValuesServiceName = "WorkItemTypeFieldAllowedValuesService";

export class WorkItemTypeFieldAllowedValuesService extends BaseDataService<IDictionaryStringTo<string[]>, string[], string> {
    constructor() {
        super();
        this.items = {};
    }

    // key = "{workitemtype}_{fieldrefname}"
    public getItem(key: string): string[] {
        return this.items[key.toLowerCase()];
    }

    public getAllowedValues(workItemType: string, fieldRefName: string): string[] {
        const key = `${workItemType}_${fieldRefName}`;
        return this.items[key.toLowerCase()];
    }

    public getKey(): string {
        return WorkItemTypeFieldAllowedValuesServiceName;
    }

    public async initializeAllowedValues(workItemType: string, fieldRefName: string) {
        const key = `${workItemType}_${fieldRefName}`;

        if (this.isLoaded(key)) {
            this._notifyChanged();
        }
        else if (!this.isLoading(key)) {
            this.setLoading(true, key);
            try {
                const workItemTypeField = await WitClient.getClient().getWorkItemTypeFieldWithReferences(VSS.getWebContext().project.id, workItemType, fieldRefName, WorkItemTypeFieldsExpandLevel.AllowedValues);
                this._populateFieldAllowedValues(workItemType, fieldRefName, workItemTypeField.allowedValues || []);
            }
            catch (e) {
                this._populateFieldAllowedValues(workItemType, fieldRefName, []);
                this.setLoading(false, key);
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _populateFieldAllowedValues(workItemType: string, fieldRefName: string, allowedValues: string[]) {
        const key = `${workItemType}_${fieldRefName}`;
        if (workItemType && fieldRefName && allowedValues) {
            this.items[key.toLowerCase()] = allowedValues;
        }

        this.setLoading(false, key);
    }
}

Services.add(WorkItemTypeFieldAllowedValuesServiceName, { serviceFactory: WorkItemTypeFieldAllowedValuesService });
