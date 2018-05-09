import { Action, BaseActionsHub } from "Library/Flux/Action";

export const KeyName = "ErrorMessage";

export class ErrorMessageActionsHub extends BaseActionsHub {
    public PushErrorMessage = new Action<{errorMessage: string, errorKey: string}>();
    public DismissErrorMessage = new Action<string>();
    public DismissAllErrorMessages = new Action<void>();

    public getKey(): string {
        return KeyName;
    }
}
