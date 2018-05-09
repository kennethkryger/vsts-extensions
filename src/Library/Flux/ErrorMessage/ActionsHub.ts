import { Action, IActionsHub } from "Library/Flux/Action";

export class ErrorMessageActionsHub implements IActionsHub {
    public PushErrorMessage = new Action<{errorMessage: string, errorKey: string}>();
    public DismissErrorMessage = new Action<string>();
    public DismissAllErrorMessages = new Action<void>();
}
