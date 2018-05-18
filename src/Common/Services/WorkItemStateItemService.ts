import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { WorkItemStateColor } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export const WorkItemStateItemServiceName = "WorkItemStateItemService";

export class WorkItemStateItemService extends BaseDataService<IDictionaryStringTo<WorkItemStateColor[]>, WorkItemStateColor[], string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(witName: string): WorkItemStateColor[] {
        return this.items[witName.toLowerCase()];
    }

    public getKey(): string {
        return WorkItemStateItemServiceName;
    }

    public async initializeWorkItemStates(workItemTypeName: string) {
        if (this.isLoaded(workItemTypeName)) {
            this._notifyChanged();
        }
        else if (!this.isLoading(workItemTypeName)) {
            this.setLoading(true, workItemTypeName);
            try {
                const workItemTypeStates = await WitClient.getClient().getWorkItemTypeStates(VSS.getWebContext().project.id, workItemTypeName);
                this._populateStateItem(workItemTypeName, workItemTypeStates);
            }
            catch (e) {
                this.setLoading(false, workItemTypeName);
                throw e.message;
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _populateStateItem(workItemTypeName: string, states: WorkItemStateColor[]) {
        if (workItemTypeName && states) {
            this.items[workItemTypeName.toLowerCase()] = states;
        }

        this.setLoading(false, workItemTypeName);
    }
}

Services.add(WorkItemStateItemServiceName, { serviceFactory: WorkItemStateItemService });
