import * as React from "react";

import { IVssComponentProps, VssComponent } from "Common/Components/Utilities/VssComponent";
import { IAppPageContext, IReactAppContext } from "Common/Utilities/Context";

export interface IReactRootComponentProperties extends IVssComponentProps {
    appContext: IAppPageContext;
}

export class ReactRootComponent extends VssComponent<IReactRootComponentProperties, {}> {
    public static childContextTypes = VssComponent.contextTypes;

    public getChildContext(): IReactAppContext {
        return {
            appContext: this.props.appContext
        };
    }

    public render(): JSX.Element {
        return (
            <>
                {this.props.children}
            </>
        );
    }
}
