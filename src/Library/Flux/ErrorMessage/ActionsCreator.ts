import { BaseActionsCreator } from "Library/Flux/Action";
import { ErrorMessageActionsHub, KeyName } from "Library/Flux/ErrorMessage";

export class ErrorMessageActionsCreator extends BaseActionsCreator {
    constructor(private _actionsHub: ErrorMessageActionsHub) {
        super();
    }

    public getKey(): string {
        return KeyName;
    }

    public showErrorMessage(errorMessage: string, errorKey: string) {
        this._actionsHub.PushErrorMessage.invoke({errorMessage: errorMessage, errorKey: errorKey});
    }

    public dismissErrorMessage(errorKey: string) {
        this._actionsHub.DismissErrorMessage.invoke(errorKey);
    }

    public dismissAllErrorMessages() {
        this._actionsHub.DismissAllErrorMessages.invoke(null);
    }
}
