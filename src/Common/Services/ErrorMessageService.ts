import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";

export const ErrorMessageServiceName = "ErrorMessageService";

export class ErrorMessageService extends BaseDataService<IDictionaryStringTo<string>, string, string> {
    constructor() {
        super();
        this.items = {};
    }

    public getKey(): string {
        return ErrorMessageServiceName;
    }

    public getItem(key: string): string {
        return this.items[key];
    }

    public showErrorMessage(errorMessage: string, errorKey: string) {
        this.items[errorKey] = errorMessage;
        this._notifyChanged();
    }

    public dismissErrorMessage(errorKey: string) {
        delete this.items[errorKey];
        this._notifyChanged();
    }

    public dismissAllErrorMessages() {
        this.items = {};
        this._notifyChanged();
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}

Services.add(ErrorMessageServiceName, { serviceFactory: ErrorMessageService });
