import * as React from "react";

import { SettingsActions } from "BugBashPro/Actions/SettingsActions";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { Loading } from "Common/Components/Loading";
import { IRichEditorProps, RichEditor } from "Common/Components/RichEditor";
import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Common/Flux/Stores/BaseStore";

export class RichEditorComponent extends BaseFluxComponent<IRichEditorProps, IBaseFluxComponentState> {
    public componentDidMount() {
        super.componentDidMount();
        if (!StoresHub.bugBashSettingsStore.isLoaded()) {
            SettingsActions.initializeBugBashSettings();
        }
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }
        else {
            return <RichEditor {...this.props} />;
        }
    }

    protected getObservableDataServices(): BaseStore<any, any, any>[] {
        return [StoresHub.bugBashSettingsStore];
    }

    protected initializeState() {
        this.state = {
            loading: !StoresHub.bugBashSettingsStore.isLoaded()
        };
    }

    protected getDataServiceState(): IBaseFluxComponentState {
        return {
            loading: StoresHub.bugBashSettingsStore.isLoading()
        };
    }
}
