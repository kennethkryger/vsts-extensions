import { IActionsCreator } from "Library/Flux/Action";
import { ErrorMessageActionsHub } from "Library/Flux/ErrorMessage";

export class ErrorMessageActionsCreator implements IActionsCreator {
    constructor(private _actionsHub: ErrorMessageActionsHub) {}

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
