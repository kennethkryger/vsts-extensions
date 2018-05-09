import { WorkItemStateItemActionsHub } from "Library/Flux/Actions/ActionsHub";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { WorkItemStateColor } from "TFS/WorkItemTracking/Contracts";

export class WorkItemStateItemStore extends BaseStore<IDictionaryStringTo<WorkItemStateColor[]>, WorkItemStateColor[], string, WorkItemStateItemActionsHub> {
    constructor(actionsHub: WorkItemStateItemActionsHub) {
        super(actionsHub);
        this.items = {};
    }

    public getItem(witName: string): WorkItemStateColor[] {
        return this.items[witName.toLowerCase()];
    }

    public getKey(): string {
        return "WorkItemStateItemStore";
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeWorkItemStateItems.addListener((stateItems: {witName: string, states: WorkItemStateColor[]}) => {
            if (stateItems) {
                this.items[stateItems.witName.toLowerCase()] = stateItems.states;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
