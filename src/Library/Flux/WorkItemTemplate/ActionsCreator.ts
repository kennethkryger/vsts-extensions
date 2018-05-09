import { BaseActionsCreator } from "Library/Flux/Action";
import {
    KeyName, WorkItemTemplateActionsHub, WorkItemTemplateStore
} from "Library/Flux/WorkItemTemplate";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WorkItemTemplateReference } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class WorkItemTemplateActionsCreator extends BaseActionsCreator {
    constructor(private _actionsHub: WorkItemTemplateActionsHub, private _workItemTemplateStore: WorkItemTemplateStore) {
        super();
    }

    public getKey(): string {
        return KeyName;
    }

    public async initializeWorkItemTemplates(teamId: string) {
        if (this._workItemTemplateStore.isLoaded(teamId)) {
            this._actionsHub.InitializeWorkItemTemplates.invoke(null);
        }
        else if (!this._workItemTemplateStore.isLoading(teamId)) {
            this._workItemTemplateStore.setLoading(true, teamId);
            try {
                const workItemTemplates = await WitClient.getClient().getTemplates(VSS.getWebContext().project.id, teamId);
                workItemTemplates.sort((a: WorkItemTemplateReference, b: WorkItemTemplateReference) => localeIgnoreCaseComparer(a.name, b.name));

                this._actionsHub.InitializeWorkItemTemplates.invoke({teamId: teamId, templates: workItemTemplates});
                this._workItemTemplateStore.setLoading(false, teamId);
            }
            catch (e) {
                this._workItemTemplateStore.setLoading(false, teamId);
                throw e.message;
            }
        }
    }
}
