import { WorkItemStateItemActionsHub } from "Library/Flux/Actions/ActionsHub";
import { WorkItemStateItemStore } from "Library/Flux/Stores/WorkItemStateItemStore";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class WorkItemStateItemActions {
    constructor(private _actionsHub: WorkItemStateItemActionsHub, private _workItemStateItemStore: WorkItemStateItemStore) {}

    public async initializeWorkItemStates(workItemTypeName: string) {
        if (this._workItemStateItemStore.isLoaded(workItemTypeName)) {
            this._actionsHub.InitializeWorkItemStateItems.invoke(null);
        }
        else if (!this._workItemStateItemStore.isLoading(workItemTypeName)) {
            this._workItemStateItemStore.setLoading(true, workItemTypeName);
            try {
                const workItemTypeStates = await WitClient.getClient().getWorkItemTypeStates(VSS.getWebContext().project.id, workItemTypeName);
                this._actionsHub.InitializeWorkItemStateItems.invoke({witName: workItemTypeName, states: workItemTypeStates});
                this._workItemStateItemStore.setLoading(false, workItemTypeName);
            }
            catch (e) {
                this._workItemStateItemStore.setLoading(false, workItemTypeName);
                throw e.message;
            }
        }
    }
}
