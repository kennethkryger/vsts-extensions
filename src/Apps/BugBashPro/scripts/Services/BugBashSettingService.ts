import { ErrorKeys } from "BugBashPro/Constants";
import { SettingsDataService } from "BugBashPro/DataServices/SettingsDataService";
import { IBugBashSettings } from "BugBashPro/Interfaces";
import { BaseDataService } from "Common/Services/BaseDataService";
import { ErrorMessageService, ErrorMessageServiceName } from "Common/Services/ErrorMessageService";
import { Services } from "Common/Utilities/Context";

export const BugBashSettingServiceName = "BugBashSettingService";

export class BugBashSettingService extends BaseDataService<IBugBashSettings, IBugBashSettings, void> {
    public getItem(_id: void): IBugBashSettings {
        return this.items;
   }

   public getKey(): string {
       return BugBashSettingServiceName;
   }

   public async initializeBugBashSettings() {
        if (this.isLoaded()) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);
            this.items = await SettingsDataService.loadSetting(`bugBashProSettings_${VSS.getWebContext().project.id}`, {} as IBugBashSettings, false);
            this.setLoading(false);
        }
    }

    public async updateBugBashSettings(settings: IBugBashSettings) {
        const errorService = this.pageContext.getService<ErrorMessageService>(ErrorMessageServiceName);
        try {
            this.items = await SettingsDataService.updateSetting<IBugBashSettings>(`bugBashProSettings_${VSS.getWebContext().project.id}`, settings, false);
            errorService.dismissErrorMessage(ErrorKeys.BugBashSettingsError);
        }
        catch (e) {
            errorService.showErrorMessage(e, ErrorKeys.BugBashSettingsError);
        }
    }

   protected convertItemKeyToString(_key: void): string {
       return null;
   }
}

Services.add(BugBashSettingServiceName, { serviceFactory: BugBashSettingService });
