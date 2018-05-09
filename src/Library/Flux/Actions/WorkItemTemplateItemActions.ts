import { WorkItemTemplateItemActionsHub } from "Library/Flux/Actions/ActionsHub";
import { WorkItemTemplateItemStore } from "Library/Flux/Stores/WorkItemTemplateItemStore";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class WorkItemTemplateItemActions {
    constructor(private _actionsHub: WorkItemTemplateItemActionsHub, private _workItemTemplateItemStore: WorkItemTemplateItemStore) {}

    public async initializeWorkItemTemplateItem(teamId: string, id: string, projectId?: string) {
        if (this._workItemTemplateItemStore.isLoaded(id)) {
            this._actionsHub.InitializeWorkItemTemplateItem.invoke(null);
        }
        else if (!this._workItemTemplateItemStore.isLoading(id)) {
            this._workItemTemplateItemStore.setLoading(true, id);
            try {
                const workItemTemplate = await WitClient.getClient().getTemplate(projectId || VSS.getWebContext().project.id, teamId, id);
                this._actionsHub.InitializeWorkItemTemplateItem.invoke(workItemTemplate);
                this._workItemTemplateItemStore.setLoading(false, id);
            }
            catch (e) {
                this._workItemTemplateItemStore.setLoading(false, id);
                throw e.message;
            }
        }
    }
}
