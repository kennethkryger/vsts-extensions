import { ChecklistDataService } from "Checklist/DataServices/ChecklistDataService";
import {
    ChecklistType, DefaultError, DefaultWorkItemTypeError, IWorkItemChecklist, IWorkItemChecklists
} from "Checklist/Interfaces";
import { BaseDataService } from "Common/Services/BaseDataService";
import { ErrorMessageService, ErrorMessageServiceName } from "Common/Services/ErrorMessageService";
import { IAppPageContext, Services } from "Common/Utilities/Context";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";

export const ChecklistServiceName = "ChecklistService";

export class ChecklistService extends BaseDataService<IDictionaryStringTo<IWorkItemChecklists>, IWorkItemChecklists, string> {
    private _workItemTypeName: string;
    private _errorMessageService: ErrorMessageService;

    constructor() {
        super();
        this.items = {};
    }

    public serviceStart(pageContext: IAppPageContext): void {
        super.serviceStart(pageContext);
        this._errorMessageService = pageContext.getService<ErrorMessageService>(ErrorMessageServiceName);
    }

    public getItem(id: string): IWorkItemChecklists {
        if (isNullOrWhiteSpace(id)) {
            return null;
        }
        return this.items[id.toLowerCase()];
    }

    public getKey(): string {
        return ChecklistServiceName;
    }

    public setCurrentWorkItemType(workItemTypeName: string) {
        this._workItemTypeName = workItemTypeName;
    }

    public checkCurrentWorkItemType(workItemTypeName: string): boolean {
        return stringEquals(this._workItemTypeName, workItemTypeName, true);
    }

    public clear() {
        this.items = {};
        this._workItemTypeName = null;
    }

    public async initializeChecklistForWorkItemType(workItemType: string, projectId?: string) {
        this._errorMessageService.dismissErrorMessage("ChecklistError");

        if (!this.isLoading(workItemType)) {
            this.setLoading(true, workItemType);
            const model = await ChecklistDataService.loadChecklistForWorkItemType(workItemType, projectId);

            if (this.checkCurrentWorkItemType(workItemType)) {
                this._refreshChecklist({personal: null, shared: null, witDefault: model});
            }

            this.setLoading(false, workItemType);
        }
    }

    public async updateChecklistForWorkItemType(checklist: IWorkItemChecklist) {
        const key = checklist.id;

        if (!this.isLoading(key)) {
            this.setLoading(true, key);
            try {
                const updatedChecklist = await ChecklistDataService.updateChecklistForWorkItemType(checklist);

                if (this.checkCurrentWorkItemType(key)) {
                    this._refreshChecklist({
                        personal: null,
                        shared: null,
                        witDefault: updatedChecklist
                    });
                }
                this.setLoading(false, key);
                this._errorMessageService.dismissErrorMessage("ChecklistError");
            }
            catch {
                this._errorMessageService.showErrorMessage(DefaultWorkItemTypeError, "ChecklistError");
                this.setLoading(false, key);
            }
        }
    }

    public initializeChecklists(workItemId: number, workItemType: string, projectId: string) {
        if (this.isLoaded(`${workItemId}`)) {
            this._errorMessageService.dismissErrorMessage("ChecklistError");
            this._refreshChecklist(null);
        }
        else {
            this.refreshChecklists(workItemId, workItemType, projectId);
        }
    }

    public async refreshChecklists(workItemId: number, workItemType: string, projectId: string) {
        const key = `${workItemId}`;

        this._errorMessageService.dismissErrorMessage("ChecklistError");

        if (!this.isLoading(key)) {
            this.setLoading(true, key);

            const models = await ChecklistDataService.loadWorkItemChecklists(workItemId, workItemType, projectId);

            this._refreshChecklist({personal: models.personal, shared: models.shared, witDefault: models.witDefault});
            this.setLoading(false, key);
        }
    }

    public async updateChecklist(checklist: IWorkItemChecklist, checklistType: ChecklistType) {
        const key = checklist.id;

        if (!this.isLoading(key)) {
            this.setLoading(true, key);
            try {
                if (checklistType === ChecklistType.WitDefault) {
                    const updatedChecklist = await ChecklistDataService.updateDefaultChecklistForWorkItem(checklist);

                    this._refreshChecklist({
                        personal: null,
                        shared: null,
                        witDefault: updatedChecklist
                    });
                }
                else {
                    const isPersonal = checklistType === ChecklistType.Personal;
                    const updatedChecklist = await ChecklistDataService.updateWorkItemChecklist(checklist, isPersonal);

                    this._refreshChecklist({
                        personal: isPersonal ? updatedChecklist : null,
                        shared: isPersonal ? null : updatedChecklist,
                        witDefault: null
                    });
                }

                this.setLoading(false, key);
                this._errorMessageService.dismissErrorMessage("ChecklistError");
            }
            catch {
                this._errorMessageService.showErrorMessage(DefaultError, "ChecklistError");
                this.setLoading(false, key);
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _refreshChecklist(checklistData: IWorkItemChecklists) {
        if (checklistData) {
            this._updateChecklist(checklistData.personal, ChecklistType.Personal);
            this._updateChecklist(checklistData.shared, ChecklistType.Shared);
            this._updateChecklist(checklistData.witDefault, ChecklistType.WitDefault);
        }
        this._notifyChanged();
    }

    private _updateChecklist(checklist: IWorkItemChecklist, checklistType: ChecklistType) {
        if (checklist) {
            const key = checklist.id.toLowerCase();
            if (this.items[key] == null) {
                this.items[key] = {personal: null, shared: null, witDefault: null};
            }

            switch (checklistType) {
                case ChecklistType.Personal:
                    this.items[key].personal = checklist;
                    break;
                case ChecklistType.Shared:
                    this.items[key].shared = checklist;
                    break;
                default:
                    this.items[key].witDefault = checklist;
            }
        }
    }
}

Services.add(ChecklistServiceName, { serviceFactory: ChecklistService });
