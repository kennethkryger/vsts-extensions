import { ErrorKeys } from "BugBashPro/Constants";
import { LongTextDataService } from "BugBashPro/DataServices/LongTextDataService";
import { ILongText } from "BugBashPro/Interfaces";
import { LongText } from "BugBashPro/ViewModels/LongText";
import { BaseDataService } from "Common/Services/BaseDataService";
import { ErrorMessageService, ErrorMessageServiceName } from "Common/Services/ErrorMessageService";
import { Services } from "Common/Utilities/Context";

export const LongTextServiceName = "LongTextService";

export class LongTextService extends BaseDataService<IDictionaryStringTo<LongText>, LongText, string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(id: string): LongText {
        if (id) {
            return this.items[id.toLowerCase()];
        }
        return null;
    }

    public getKey(): string {
        return LongTextServiceName;
    }

    public fireStoreChange() {
        this._notifyChanged();
    }

    public clean() {
        this.items = {};
        this.fireStoreChange();
    }

    public initializeLongText(id: string) {
        if (this.isLoaded(id)) {
            this.fireStoreChange();
        }
        else {
            this.refreshLongText(id, false);
        }
    }

    public async refreshLongText(id: string, clearError: boolean = true) {
        if (!this.isLoading(id)) {
            this.setLoading(true, id);

            const longText = await LongTextDataService.loadLongText(id);
            this.items[longText.id.toLowerCase()] = new LongText(longText);
            this.setLoading(false, id);

            if (clearError) {
                this.pageContext.getService<ErrorMessageService>(ErrorMessageServiceName).dismissErrorMessage(ErrorKeys.BugBashDetailsError);
            }
        }
    }

    public async addOrUpdateLongText(longText: ILongText) {
        if (!this.isLoading(longText.id)) {
            const errorService = this.pageContext.getService<ErrorMessageService>(ErrorMessageServiceName);
            this.setLoading(true, longText.id);
            try {
                const savedLongText = await LongTextDataService.addOrUpdateLongText(longText);
                this.items[savedLongText.id.toLowerCase()] = new LongText(savedLongText);

                this.setLoading(false, longText.id);
                errorService.dismissErrorMessage(ErrorKeys.BugBashDetailsError);
            }
            catch (e) {
                this.setLoading(false, longText.id);
                errorService.showErrorMessage(e, ErrorKeys.BugBashDetailsError);
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
       return key;
    }
}

Services.add(LongTextServiceName, { serviceFactory: LongTextService });
