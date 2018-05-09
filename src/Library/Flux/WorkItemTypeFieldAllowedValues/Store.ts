import { BaseStore } from "Library/Flux/BaseStore";
import {
    WorkItemTypeFieldAllowedValuesActionsHub
} from "Library/Flux/WorkItemTypeFieldAllowedValues";

export class WorkItemTypeFieldAllowedValuesStore extends BaseStore<IDictionaryStringTo<string[]>, string[], string, WorkItemTypeFieldAllowedValuesActionsHub> {
    constructor(actionsHub: WorkItemTypeFieldAllowedValuesActionsHub) {
        super(actionsHub);
        this.items = {};
    }

    // key = "{workitemtype}_{fieldrefname}"
    public getItem(key: string): string[] {
        return this.items[key.toLowerCase()];
    }

    public getAllowedValues(workItemType: string, fieldRefName: string): string[] {
        const key = `${workItemType}_${fieldRefName}`;
        return this.items[key.toLowerCase()];
    }

    public getKey(): string {
        return "WorkItemTypeFieldAllowedValuesStore";
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeAllowedValues.addListener((data: {
            workItemType: string,
            fieldRefName: string,
            allowedValues: string[]
        }) => {
            if (data) {
                const key = `${data.workItemType}_${data.fieldRefName}`;
                this.items[key.toLowerCase()] = data.allowedValues;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
