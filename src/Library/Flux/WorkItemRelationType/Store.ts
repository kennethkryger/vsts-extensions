import { BaseStore } from "Library/Flux/BaseStore";
import { WorkItemRelationTypeActionsHub } from "Library/Flux/WorkItemRelationType";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";

export class WorkItemRelationTypeStore extends BaseStore<WorkItemRelationType[], WorkItemRelationType, string, WorkItemRelationTypeActionsHub> {
    private _itemsRefNameMap: IDictionaryStringTo<WorkItemRelationType>;
    private _itemsNameMap: IDictionaryStringTo<WorkItemRelationType>;

    constructor(actionsHub: WorkItemRelationTypeActionsHub) {
        super(actionsHub);
        this._itemsRefNameMap = {};
        this._itemsNameMap = {};
    }

    public getItem(relationTypeRefName: string): WorkItemRelationType {
        const key = (relationTypeRefName || "").toLowerCase();
        return this._itemsRefNameMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return "WorkItemRelationTypeStore";
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeWorkItemRelationTypes.addListener((workItemRelationTypes: WorkItemRelationType[]) => {
            if (workItemRelationTypes) {
                this.items = workItemRelationTypes;
                this._itemsRefNameMap = {};
                this._itemsNameMap = {};

                for (const item of this.items) {
                    this._itemsRefNameMap[item.referenceName.toLowerCase()] = item;
                    this._itemsNameMap[item.name.toLowerCase()] = item;
                }
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
