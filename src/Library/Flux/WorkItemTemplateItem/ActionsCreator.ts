import { BaseActionsCreator } from "Library/Flux/Action";
import {
    KeyName, WorkItemTemplateItemActionsHub, WorkItemTemplateItemStore
} from "Library/Flux/WorkItemTemplateItem";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class WorkItemTemplateItemActionsCreator extends BaseActionsCreator {
    constructor(private _actionsHub: WorkItemTemplateItemActionsHub, private _workItemTemplateItemStore: WorkItemTemplateItemStore) {
        super();
    }

    public getKey(): string {
        return KeyName;
    }

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