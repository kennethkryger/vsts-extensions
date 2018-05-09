import { BaseActionsCreator } from "Library/Flux/Action";
import {
    KeyName, WorkItemRelationTypeActionsHub, WorkItemRelationTypeStore
} from "Library/Flux/WorkItemRelationType";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class WorkItemRelationTypeActionsCreator extends BaseActionsCreator {
    constructor(private _actionsHub: WorkItemRelationTypeActionsHub, private _workItemRelationTypeStore: WorkItemRelationTypeStore) {
        super();
    }

    public getKey(): string {
        return KeyName;
    }

    public async initializeWorkItemRelationTypes() {
        if (this._workItemRelationTypeStore.isLoaded()) {
            this._actionsHub.InitializeWorkItemRelationTypes.invoke(null);
        }
        else if (!this._workItemRelationTypeStore.isLoading()) {
            this._workItemRelationTypeStore.setLoading(true);
            try {
                const workItemRelationTypes = await WitClient.getClient().getRelationTypes();
                workItemRelationTypes.sort((a: WorkItemRelationType, b: WorkItemRelationType) => localeIgnoreCaseComparer(a.name, b.name));

                this._actionsHub.InitializeWorkItemRelationTypes.invoke(workItemRelationTypes);
                this._workItemRelationTypeStore.setLoading(false);
            }
            catch (e) {
                this._workItemRelationTypeStore.setLoading(false);
                throw e.message;
            }
        }
    }
}
