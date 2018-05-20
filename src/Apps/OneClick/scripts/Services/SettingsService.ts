import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { stringEquals } from "Common/Utilities/String";
import { SettingKey } from "OneClick/Constants";
import { SettingsDataService } from "OneClick/DataServices/SettingsDataService";

export const SettingsServiceName = "SettingsService";

export class SettingsService extends BaseDataService<IDictionaryStringTo<any>, any, string> {
    private _workItemTypeName: string;

    constructor() {
        super();
        this.items = {};
    }

    public getItem<T>(key: SettingKey): T {
        return this.items[key.toLowerCase()] as T;
    }

    public getKey(): string {
        return SettingsServiceName;
    }

    public setCurrentWorkItemType(workItemTypeName: string) {
        this._workItemTypeName = workItemTypeName;
    }

    public checkCurrentWorkItemType(workItemTypeName: string): boolean {
        return stringEquals(this._workItemTypeName, workItemTypeName, true);
    }

    public clear() {
        this.items = {};
    }

    public async initializeSetting<T>(workItemTypeName: string, key: SettingKey, isPrivate: boolean, defaultValue?: T) {
        const storeKey = this._getStoreKey(workItemTypeName, key);

        if (!this.isLoading(storeKey)) {
            this.setLoading(true, storeKey);

            const value = await SettingsDataService.loadSetting<T>(
                key,
                defaultValue,
                workItemTypeName,
                VSS.getWebContext().project.id,
                isPrivate);

            if (this.checkCurrentWorkItemType(workItemTypeName)) {
                this._setItem(key, value, storeKey);
            }
            else {
                this.setLoading(false, storeKey);
            }
        }
    }

    public async updateSetting<T>(workItemTypeName: string, key: SettingKey, value: T, isPrivate: boolean) {
        const storeKey = this._getStoreKey(workItemTypeName, key);

        if (!this.isLoading(storeKey)) {
            this.setLoading(true, storeKey);

            const newValue = await SettingsDataService.updateSetting<T>(
                key,
                value,
                workItemTypeName,
                VSS.getWebContext().project.id,
                isPrivate);

            if (this.checkCurrentWorkItemType(workItemTypeName)) {
                this._setItem(key, newValue, storeKey);
            }
            else {
                this.setLoading(false, storeKey);
            }

            SettingsDataService.updateCacheStamp(workItemTypeName, VSS.getWebContext().project.id);
        }
    }

    protected convertItemKeyToString(key: SettingKey): string {
        return key;
    }

    private _setItem(key: string, value: any, storeKey: string) {
        this.items[key.toLowerCase()] = value;
        this.setLoading(false, storeKey);
    }

    private _getStoreKey(workItemTypeName: string, key: SettingKey): string {
        return `${workItemTypeName}_${key}`;
    }
}

Services.add(SettingsServiceName, { serviceFactory: SettingsService });
