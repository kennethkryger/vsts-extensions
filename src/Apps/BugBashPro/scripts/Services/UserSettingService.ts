import { ErrorKeys } from "BugBashPro/Constants";
import { IUserSettings } from "BugBashPro/Interfaces";
import { BaseDataService } from "Common/Services/BaseDataService";
import { ErrorMessageService, ErrorMessageServiceName } from "Common/Services/ErrorMessageService";
import { Services } from "Common/Utilities/Context";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";

export const UserSettingServiceName = "UserSettingService";

export class UserSettingService extends BaseDataService<IDictionaryStringTo<IUserSettings>, IUserSettings, string> {
    public getItem(id: string): IUserSettings {
        if (!this.items) {
            return null;
        }

        return this.items[(id || "").toLowerCase()];
    }

    public getKey(): string {
        return UserSettingServiceName;
    }

    public async initializeUserSettings() {
        if (this.isLoaded()) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);
            const settings = await ExtensionDataManager.readDocuments<IUserSettings>(`UserSettings_${VSS.getWebContext().project.id}`, false);
            if (!this.items) {
                this.items = {};
            }
            for (const setting of settings) {
                this.items[setting.id.toLowerCase()] = setting;
            }
            this.setLoading(false);
        }
    }

    public async updateUserSettings(settings: IUserSettings) {
        const errorService = this.pageContext.getService<ErrorMessageService>(ErrorMessageServiceName);
        try {
            const updatedSettings = await ExtensionDataManager.addOrUpdateDocument<IUserSettings>(`UserSettings_${VSS.getWebContext().project.id}`, settings, false);
            if (!this.items) {
                this.items = {};
            }
            this.items[updatedSettings.id.toLowerCase()] = updatedSettings;
            this._notifyChanged();
            errorService.dismissErrorMessage(ErrorKeys.BugBashSettingsError);
        }
        catch (e) {
            errorService.showErrorMessage(
                "Settings could not be saved due to an unknown error. Please refresh the page and try again.",
                ErrorKeys.BugBashSettingsError
            );
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}

Services.add(UserSettingServiceName, { serviceFactory: UserSettingService });
