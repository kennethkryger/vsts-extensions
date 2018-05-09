import { WorkItemTypeActionsHub } from "Library/Flux/Actions/ActionsHub";
import { WorkItemTypeStore } from "Library/Flux/Stores/WorkItemTypeStore";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class WorkItemTypeActions {
    constructor(private _actionsHub: WorkItemTypeActionsHub, private _workItemTypeStore: WorkItemTypeStore) {}

    public async initializeWorkItemTypes() {
        if (this._workItemTypeStore.isLoaded()) {
            this._actionsHub.InitializeWorkItemTypes.invoke(null);
        }
        else if (!this._workItemTypeStore.isLoading()) {
            this._workItemTypeStore.setLoading(true);
            try {
                const workItemTypes = await WitClient.getClient().getWorkItemTypes(VSS.getWebContext().project.id);
                workItemTypes.sort((a: WorkItemType, b: WorkItemType) => localeIgnoreCaseComparer(a.name, b.name));

                this._actionsHub.InitializeWorkItemTypes.invoke(workItemTypes);
                this._workItemTypeStore.setLoading(false);
            }
            catch (e) {
                this._workItemTypeStore.setLoading(false);
                throw e.message;
            }
        }
    }
}
