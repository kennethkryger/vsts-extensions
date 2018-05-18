import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { localeIgnoreCaseComparer } from "Common/Utilities/String";
import { WorkItemTemplateReference } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export const WorkItemTemplateServiceName = "WorkItemTemplateService";

export class WorkItemTemplateService extends BaseDataService<IDictionaryStringTo<WorkItemTemplateReference[]>, WorkItemTemplateReference[], string> {
    private _itemsIdMap: IDictionaryStringTo<WorkItemTemplateReference>;

    constructor() {
        super();
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
        return WorkItemTemplateServiceName;
    }

    public async initializeWorkItemTemplates(teamId: string) {
        if (this.isLoaded(teamId)) {
            this._notifyChanged();
        }
        else if (!this.isLoading(teamId)) {
            this.setLoading(true, teamId);
            try {
                const workItemTemplates = await WitClient.getClient().getTemplates(VSS.getWebContext().project.id, teamId);
                workItemTemplates.sort((a: WorkItemTemplateReference, b: WorkItemTemplateReference) => localeIgnoreCaseComparer(a.name, b.name));
                this._populateTemplatesForTeam(teamId, workItemTemplates);
            }
            catch (e) {
                this.setLoading(false, teamId);
                throw e.message;
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _populateTemplatesForTeam(teamId: string, templates: WorkItemTemplateReference[]) {
        if (teamId && templates) {
            this.items[teamId.toLowerCase()] = templates;

            for (const template of templates) {
                this._itemsIdMap[template.id.toLowerCase()] = template;
            }
        }

        this.setLoading(false, teamId);
    }
}

Services.add(WorkItemTemplateServiceName, { serviceFactory: WorkItemTemplateService });
