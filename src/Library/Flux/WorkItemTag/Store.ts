import { BaseStore } from "Library/Flux/BaseStore";
import { WorkItemTagActionsHub } from "Library/Flux/WorkItemTag";
import { WebApiTagDefinition } from "TFS/Core/Contracts";

export class WorkItemTagStore extends BaseStore<WebApiTagDefinition[], WebApiTagDefinition, string, WorkItemTagActionsHub> {
    private _itemsIdMap: IDictionaryStringTo<WebApiTagDefinition>;
    private _itemsNameMap: IDictionaryStringTo<WebApiTagDefinition>;

    constructor(actionsHub: WorkItemTagActionsHub) {
        super(actionsHub);
        this._itemsIdMap = {};
        this._itemsNameMap = {};
    }

    public getItem(idOrName: string): WebApiTagDefinition {
        const key = (idOrName || "").toLowerCase();
        return this._itemsIdMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return "WorkItemTagStore";
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeTags.addListener((tags: WebApiTagDefinition[]) => {
            if (tags) {
                this.items = tags;
                this._itemsIdMap = {};
                this._itemsNameMap = {};

                for (const item of this.items) {
                    this._itemsIdMap[item.id.toLowerCase()] = item;
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
