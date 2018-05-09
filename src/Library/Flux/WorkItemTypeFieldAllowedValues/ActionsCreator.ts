import { BaseActionsCreator } from "Library/Flux/Action";
import {
    KeyName, WorkItemTypeFieldAllowedValuesActionsHub, WorkItemTypeFieldAllowedValuesStore
} from "Library/Flux/WorkItemTypeFieldAllowedValues";
import { WorkItemTypeFieldsExpandLevel } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class WorkItemTypeFieldAllowedValuesActionsCreator extends BaseActionsCreator {
    constructor(private _actionsHub: WorkItemTypeFieldAllowedValuesActionsHub, private _workItemTypeFieldAllowedValuesStore: WorkItemTypeFieldAllowedValuesStore) {
        super();
    }

    public getKey(): string {
        return KeyName;
    }

    public async initializeAllowedValues(workItemType: string, fieldRefName: string) {
        const key = `${workItemType}_${fieldRefName}`;

        if (this._workItemTypeFieldAllowedValuesStore.isLoaded(key)) {
            this._actionsHub.InitializeAllowedValues.invoke(null);
        }
        else if (!this._workItemTypeFieldAllowedValuesStore.isLoading(key)) {
            this._workItemTypeFieldAllowedValuesStore.setLoading(true, key);
            try {
                const workItemTypeField = await WitClient.getClient().getWorkItemTypeFieldWithReferences(VSS.getWebContext().project.id, workItemType, fieldRefName, WorkItemTypeFieldsExpandLevel.AllowedValues);

                this._actionsHub.InitializeAllowedValues.invoke({
                    workItemType: workItemType,
                    fieldRefName: fieldRefName,
                    allowedValues: workItemTypeField.allowedValues || []
                });
                this._workItemTypeFieldAllowedValuesStore.setLoading(false, key);
            }
            catch (e) {
                this._actionsHub.InitializeAllowedValues.invoke({
                    workItemType: workItemType,
                    fieldRefName: fieldRefName,
                    allowedValues: []
                });
                this._workItemTypeFieldAllowedValuesStore.setLoading(false, key);
            }
        }
    }
}
