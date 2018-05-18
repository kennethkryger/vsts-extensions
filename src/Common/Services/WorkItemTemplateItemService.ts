import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { WorkItemTemplate } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export const WorkItemTemplateItemServiceName = "WorkItemTemplateItemService";

export class WorkItemTemplateItemService extends BaseDataService<IDictionaryStringTo<WorkItemTemplate>, WorkItemTemplate, string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(id: string): WorkItemTemplate {
        const key = (id || "").toLowerCase();
        return this.items[key];
    }

    public getKey(): string {
        return WorkItemTemplateItemServiceName;
    }

    public async initializeWorkItemTemplateItem(teamId: string, id: string, projectId?: string) {
        if (this.isLoaded(id)) {
            this._notifyChanged();
        }
        else if (!this.isLoading(id)) {
            this.setLoading(true, id);
            try {
                const workItemTemplate = await WitClient.getClient().getTemplate(projectId || VSS.getWebContext().project.id, teamId, id);
                this._populateTemplateItem(workItemTemplate);
                this.setLoading(false, id);
            }
            catch (e) {
                this.setLoading(false, id);
                throw e.message;
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _populateTemplateItem(template: WorkItemTemplate) {
        if (template) {
            this.items[template.id.toLowerCase()] = template;
        }

        this.setLoading(false, template.id);
    }
}

Services.add(WorkItemTemplateItemServiceName, { serviceFactory: WorkItemTemplateItemService });
