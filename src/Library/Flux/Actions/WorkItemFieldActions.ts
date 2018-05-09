import { WorkItemFieldActionsHub } from "Library/Flux/Actions/ActionsHub";
import { WorkItemFieldStore } from "Library/Flux/Stores/WorkItemFieldStore";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class WorkItemFieldActions {
    constructor(private _actionsHub: WorkItemFieldActionsHub, private _workItemFieldStore: WorkItemFieldStore) {}

    public async initializeWorkItemFields() {
        if (this._workItemFieldStore.isLoaded()) {
            this._actionsHub.InitializeWorkItemFields.invoke(null);
        }
        else if (!this._workItemFieldStore.isLoading()) {
            this._workItemFieldStore.setLoading(true);
            try {
                const workItemFields = await WitClient.getClient().getFields(VSS.getWebContext().project.id);
                workItemFields.sort((a: WorkItemField, b: WorkItemField) => localeIgnoreCaseComparer(a.name, b.name));
                this._actionsHub.InitializeWorkItemFields.invoke(workItemFields);
                this._workItemFieldStore.setLoading(false);
            }
            catch (e) {
                this._workItemFieldStore.setLoading(false);
                throw e.message;
            }
        }
    }
}
