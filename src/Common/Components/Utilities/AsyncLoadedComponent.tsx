import * as React from "react";

import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";

export type ModuleComponentSelector<TProps> = (...modules: any[]) => React.ComponentClass<TProps> | React.StatelessComponent<TProps>;

interface IAsyncLoadedComponentProps<TProps> extends IVssComponentProps {
    modules: string[];
    moduleComponentSelector: ModuleComponentSelector<TProps>;
    props: TProps;
    componentWhileLoading?(): JSX.Element;
}

interface IAsyncLoadedComponentState<TProps> extends IVssComponentState {
    componentType: React.ComponentClass<TProps> | React.StatelessComponent<TProps>;
}

class AsyncLoadedComponent<TProps> extends VssComponent<IAsyncLoadedComponentProps<TProps>, IAsyncLoadedComponentState<TProps>> {
    private _isMounted: boolean = false;

    public render(): JSX.Element {
        if (!this.state.componentType) {
            if (this.props.componentWhileLoading) {
                return this.props.componentWhileLoading();
            }

            return null;
        }

        return React.createElement(this.state.componentType, this.props.props);
    }

    public componentDidMount(): void {
        super.componentDidMount();

        this._isMounted = true;

        if (!this.state.componentType && !this.state.loading) {
            this.setState({
                loading: true,
                componentType: null
            });

            VSS.require(this.props.modules, (...modules) => {
                if (this._isMounted) {
                    this.setState({
                        loading: false,
                        componentType: this.props.moduleComponentSelector(...modules)
                    });
                }
            });
        }
    }

    public componentWillUnmount(): void {
        super.componentWillUnmount();

        if (this.state.loading) {
            this.setState({
                loading: false,
                componentType: null
            });
        }

        this._isMounted = false;
    }

    protected getInitialState(): IAsyncLoadedComponentState<TProps> {
        return {
            loading: false,
            componentType: null
        };
    }
}

export function getAsyncLoadedComponent<TProps = {}>
    (modules: string[],
     moduleComponentSelector: ModuleComponentSelector<TProps>,
     componentWhileLoading?: () => JSX.Element): (props: TProps) => JSX.Element {

    return (props: TProps) => React.createElement(
        AsyncLoadedComponent,
        {
            modules,
            moduleComponentSelector,
            componentWhileLoading,
            props,
        } as IAsyncLoadedComponentProps<TProps>);
}
