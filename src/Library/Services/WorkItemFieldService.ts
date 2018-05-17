import { BaseDataService } from "Library/Services/BaseDataService";
import { Services } from "Library/Utilities/Context";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export const WorkItemFieldServiceName = "WorkItemFieldService";

export class WorkItemFieldService extends BaseDataService<WorkItemField[], WorkItemField, string> {
    private _itemsRefNameMap: IDictionaryStringTo<WorkItemField>;
    private _itemsNameMap: IDictionaryStringTo<WorkItemField>;

    constructor() {
        super();
        this._itemsRefNameMap = {};
        this._itemsNameMap = {};
    }

    public getItem(fieldRefName: string): WorkItemField {
        const key = (fieldRefName || "").toLowerCase();
        return this._itemsRefNameMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return WorkItemFieldServiceName;
    }

    public async initializeWorkItemFields() {
        if (this.isLoaded()) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);
            try {
                const workItemFields = await WitClient.getClient().getFields(VSS.getWebContext().project.id);
                workItemFields.sort((a: WorkItemField, b: WorkItemField) => localeIgnoreCaseComparer(a.name, b.name));
                this._populateFields(workItemFields);
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _populateFields(fields: WorkItemField[]) {
        if (fields) {
            this.items = fields;
            this._itemsRefNameMap = {};
            this._itemsNameMap = {};

            for (const item of this.items) {
                this._itemsRefNameMap[item.referenceName.toLowerCase()] = item;
                this._itemsNameMap[item.name.toLowerCase()] = item;
            }
        }

        this.setLoading(false);
    }
}

Services.add(WorkItemFieldServiceName, { serviceFactory: WorkItemFieldService });
