import "./WorkItemTagPicker.scss";

import * as React from "react";

import { InfoLabel } from "Common/Components/InfoLabel";
import { InputError } from "Common/Components/InputError";
import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";
import { BaseDataService } from "Common/Services/BaseDataService";
import { WorkItemTagService, WorkItemTagServiceName } from "Common/Services/WorkItemTagService";
import { findIndex } from "Common/Utilities/Array";
import { IReactAppContext } from "Common/Utilities/Context";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { ValidationState } from "OfficeFabric/components/pickers/BasePicker.types";
import { ITag, TagPicker } from "OfficeFabric/components/pickers/TagPicker/TagPicker";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WebApiTagDefinition } from "TFS/Core/Contracts";

export interface IWorkItemTagPickerProps extends IVssComponentProps {
    selectedTags?: string[];
    error?: string;
    label?: string;
    info?: string;
    disabled?: boolean;
    required?: boolean;
    onChange?(tags: string[]): void;
}

export interface IWorkItemTagPickerState extends IVssComponentState {
    allTags?: WebApiTagDefinition[];
    internalSelectedTags?: string[];
}

export class WorkItemTagPicker extends VssComponent<IWorkItemTagPickerProps, IWorkItemTagPickerState> {
    private _workItemTagService: WorkItemTagService;

    constructor(props: IWorkItemTagPickerProps, context?: IReactAppContext) {
        super(props, context);
        this._workItemTagService = this.context.appContext.getService<WorkItemTagService>(WorkItemTagServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemTagService.isLoaded()) {
            this.setState({
                allTags: this._workItemTagService.getAll()
            });
        }
        else {
            this._workItemTagService.initializeTags();
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemTagPickerProps, context?: IReactAppContext) {
        super.componentWillReceiveProps(nextProps, context);
        this.setState({internalSelectedTags: nextProps.selectedTags});
    }

    public render(): JSX.Element {
        if (!this.state.allTags) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const {label, disabled, info, className} = this.props;
        const error = this.props.error || this._getDefaultError();

        return (
            <div className={css("work-item-tag-picker", className)}>
                {label && <InfoLabel className="work-item-tag-picker-label" label={label} info={info} />}
                <TagPicker
                    disabled={disabled}
                    selectedItems={(this.state.internalSelectedTags || []).map(this._getTag)}
                    onResolveSuggestions={this._onTagFilterChanged}
                    getTextFromItem={this._getTagText}
                    onChange={this._onChange}
                    onValidateInput={this._onValidateInput}
                    createGenericItem={this._createGenericItem}
                    inputProps={{
                        style: {
                            height: "26px"
                        }
                    }}
                    pickerSuggestionsProps={
                        {
                            suggestionsHeaderText: "Suggested Tags",
                            noResultsFoundText: "No suggested tags. Press enter to select current input."
                        }
                    }
                />
                {error && <InputError className="work-item-tag-picker-error" error={error} />}
            </div>
        );
    }

    protected getDataServiceState(): IWorkItemTagPickerState {
        return {
            allTags: this._workItemTagService.getAll()
        };
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._workItemTagService];
    }

    protected getInitialState(props: IWorkItemTagPickerProps): IWorkItemTagPickerState {
        return {
            internalSelectedTags: props.selectedTags
        };
    }

    private _getDefaultError(): string {
        if (!this.state.internalSelectedTags || this.state.internalSelectedTags.length === 0) {
            return this.props.required ? "A value is required." : null;
        }

        return null;
    }

    private _onValidateInput = (value: string): ValidationState => {
        return isNullOrWhiteSpace(value) ? ValidationState.invalid : ValidationState.valid;
    }

    private _createGenericItem = (input: string): any => {
        return {
            key: input,
            name: input
        };
    }

    private _onChange = (items: ITag[]) => {
        const selectedTags = items.map(i => i.name);
        this.setState(
            {
                internalSelectedTags: selectedTags
            },
            () => {
                if (this.props.onChange) {
                    this.props.onChange(selectedTags);
                }
            }
        );
    }

    private _getTag = (tag: string): ITag => {
        return {
            key: tag,
            name: tag
        };
    }

    private _getTagText = (tag: ITag): string => {
        return tag.name;
    }

    private _onTagFilterChanged = (filterText: string, tagList: ITag[]): ITag[] => {
        if (isNullOrWhiteSpace(filterText)) {
            return [];
        }

        return this.state.allTags
            .filter(tag => tag.name.toLowerCase().indexOf(filterText.toLowerCase()) === 0 && findIndex(tagList, (t: ITag) => stringEquals(t.key, tag.name, true)) === -1)
            .map(tag => {
                return { key: tag.name, name: tag.name};
            });
    }
}
