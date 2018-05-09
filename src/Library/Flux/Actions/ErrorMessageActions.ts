import { ErrorMessageActionsHub } from "Library/Flux/Actions/ActionsHub";

export class ErrorMessageActions {
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
