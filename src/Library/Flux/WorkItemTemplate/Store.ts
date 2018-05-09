import { BaseStore } from "Library/Flux/BaseStore";
import { WorkItemTemplateActionsHub } from "Library/Flux/WorkItemTemplate";
import { WorkItemTemplateReference } from "TFS/WorkItemTracking/Contracts";

export class WorkItemTemplateStore extends BaseStore<IDictionaryStringTo<WorkItemTemplateReference[]>, WorkItemTemplateReference[], string, WorkItemTemplateActionsHub> {
    private _itemsIdMap: IDictionaryStringTo<WorkItemTemplateReference>;

    constructor(actionsHub: WorkItemTemplateActionsHub) {
        super(actionsHub);
        this.items = {};
        this._itemsIdMap = {};
    }

    public getItem(teamId: string): WorkItemTemplateReference[] {
        const key = (teamId || "").toLowerCase();
        return this.items[key];
    }

    public getTemplate(id: string): WorkItemTemplateReference {
        const key = (id || "").toLowerCase();
        return this._itemsIdMap[key];
    }

    public getKey(): string {
        return "WorkItemTemplateStore";
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeWorkItemTemplates.addListener((data: {teamId: string, templates: WorkItemTemplateReference[]}) => {
            if (data && data.teamId && data.templates) {
                this.items[data.teamId.toLowerCase()] = data.templates;

                for (const template of data.templates) {
                    this._itemsIdMap[template.id.toLowerCase()] = template;
                }
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
