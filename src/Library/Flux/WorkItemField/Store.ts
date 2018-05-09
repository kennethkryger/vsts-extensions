import { BaseStore } from "Library/Flux/BaseStore";
import { WorkItemFieldActionsHub } from "Library/Flux/WorkItemField";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";

export class WorkItemFieldStore extends BaseStore<WorkItemField[], WorkItemField, string, WorkItemFieldActionsHub> {
    private _itemsRefNameMap: IDictionaryStringTo<WorkItemField>;
    private _itemsNameMap: IDictionaryStringTo<WorkItemField>;

    constructor(actionsHub: WorkItemFieldActionsHub) {
        super(actionsHub);
        this._itemsRefNameMap = {};
        this._itemsNameMap = {};
    }

    public getItem(fieldRefName: string): WorkItemField {
        const key = (fieldRefName || "").toLowerCase();
        return this._itemsRefNameMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return "WorkItemFieldStore";
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeWorkItemFields.addListener((fields: WorkItemField[]) => {
            if (fields) {
                this.items = fields;
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
