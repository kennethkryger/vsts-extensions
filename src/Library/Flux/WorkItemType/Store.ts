import { BaseStore } from "Library/Flux/BaseStore";
import { WorkItemTypeActionsHub } from "Library/Flux/WorkItemType";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";

export class WorkItemTypeStore extends BaseStore<WorkItemType[], WorkItemType, string, WorkItemTypeActionsHub> {
    private _itemsIdMap: IDictionaryStringTo<WorkItemType>;

    constructor(actionsHub: WorkItemTypeActionsHub) {
        super(actionsHub);
        this._itemsIdMap = {};
    }

    public getItem(typeName: string): WorkItemType {
        const key = (typeName || "").toLowerCase();
        return this._itemsIdMap[key];
    }

    public getKey(): string {
        return "WorkItemTypeStore";
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeWorkItemTypes.addListener((workItemTypes: WorkItemType[]) => {
            if (workItemTypes) {
                this.items = workItemTypes;
                this._itemsIdMap = {};

                for (const item of this.items) {
                    this._itemsIdMap[item.name.toLowerCase()] = item;
                }
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
