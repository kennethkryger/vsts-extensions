import { BaseStore } from "Library/Flux/BaseStore";
import { ErrorMessageActionsHub } from "Library/Flux/ErrorMessage";

export class ErrorMessageStore extends BaseStore<IDictionaryStringTo<string>, string, string, ErrorMessageActionsHub> {
    constructor(actionsHub: ErrorMessageActionsHub) {
        super(actionsHub);
        this.items = {};
    }

    public getKey(): string {
        return "ErrorMessageStore";
    }

    public getItem(key: string): string {
        return this.items[key];
    }

    protected initializeActionListeners() {
        this.actionsHub.PushErrorMessage.addListener((error: {errorMessage: string, errorKey: string}) => {
            this.items[error.errorKey] = error.errorMessage;
            this.emitChanged();
        });

        this.actionsHub.DismissErrorMessage.addListener((errorKey: string) => {
            delete this.items[errorKey];
            this.emitChanged();
        });

        this.actionsHub.DismissAllErrorMessages.addListener(() => {
            this.items = {};
            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
