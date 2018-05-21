import "./AddNewRelationActionRenderer.scss";

import * as React from "react";

import { InfoLabel } from "Common/Components/InfoLabel";
import { InputError } from "Common/Components/InputError";
import { Loading } from "Common/Components/Loading";
import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";
import { TeamPicker } from "Common/Components/VSTS/TeamPicker";
import { WorkItemRelationTypePicker } from "Common/Components/VSTS/WorkItemRelationTypePicker";
import { WorkItemTypePicker } from "Common/Components/VSTS/WorkItemTypePicker";
import { BaseDataService } from "Common/Services/BaseDataService";
import { TeamService, TeamServiceName } from "Common/Services/TeamService";
import {
    WorkItemRelationTypeService, WorkItemRelationTypeServiceName
} from "Common/Services/WorkItemRelationTypeService";
import {
    WorkItemTemplateService, WorkItemTemplateServiceName
} from "Common/Services/WorkItemTemplateService";
import { WorkItemTypeService, WorkItemTypeServiceName } from "Common/Services/WorkItemTypeService";
import { IReactAppContext } from "Common/Utilities/Context";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { Checkbox } from "OfficeFabric/Checkbox";
import { Dropdown, IDropdownOption, IDropdownProps } from "OfficeFabric/Dropdown";
import { Link } from "OfficeFabric/Link";
import { css } from "OfficeFabric/Utilities";
import { WebApiTeam } from "TFS/Core/Contracts";
import {
    WorkItemRelationType, WorkItemTemplateReference, WorkItemType
} from "TFS/WorkItemTracking/Contracts";

export interface IAddNewRelationActionRendererProps extends IVssComponentProps {
    workItemType: string;
    relationType: string;
    teamId: string;
    templateId: string;
    autoCreate: boolean;
    onWorkItemTypeChange(value: string): void;
    onRelationTypeChange(value: string): void;
    onTeamChange(value: string): void;
    onTemplateChange(value: string): void;
    onAutoCreateChange(value: boolean): void;
}

export interface IAddNewRelationActionRendererState extends IVssComponentState {
    templates?: WorkItemTemplateReference[];
}

export class AddNewRelationActionRenderer extends VssComponent<IAddNewRelationActionRendererProps, IAddNewRelationActionRendererState> {
    private _workItemRelationTypeService: WorkItemRelationTypeService;
    private _workItemTypeService: WorkItemTypeService;
    private _teamService: TeamService;
    private _workItemTemplateService: WorkItemTemplateService;

    constructor(props: IAddNewRelationActionRendererProps, context?: IReactAppContext) {
        super(props, context);
        this._workItemRelationTypeService = this.context.appContext.getService<WorkItemRelationTypeService>(WorkItemRelationTypeServiceName);
        this._workItemTypeService = this.context.appContext.getService<WorkItemTypeService>(WorkItemTypeServiceName);
        this._teamService = this.context.appContext.getService<TeamService>(TeamServiceName);
        this._workItemTemplateService = this.context.appContext.getService<WorkItemTemplateService>(WorkItemTemplateServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        this._workItemTypeService.initializeWorkItemTypes();
        this._workItemRelationTypeService.initializeWorkItemRelationTypes();
        this._teamService.initializeTeams();

        if (!isNullOrWhiteSpace(this.props.teamId)) {
            this._loadTemplates(this.props.teamId);
        }
    }

    public componentWillReceiveProps(nextProps: IAddNewRelationActionRendererProps, context?: IReactAppContext) {
        super.componentWillReceiveProps(nextProps, context);

        if (!isNullOrWhiteSpace(nextProps.teamId)) {
            if (!stringEquals(nextProps.teamId, this.props.teamId, true)) {
                if (this._workItemTemplateService.isLoaded(nextProps.teamId)) {
                    this.setState({templates: this._workItemTemplateService.getItem(nextProps.teamId)});
                }
                else {
                    this._loadTemplates(nextProps.teamId);
                }
            }
        }
        else {
            this.setState({templates: []});
        }
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        const selectedWit: WorkItemType = this._workItemTypeService.getItem(this.props.workItemType);
        const selectedRelationType: WorkItemRelationType = this._workItemRelationTypeService.getItem(this.props.relationType);
        const selectedTeam: WebApiTeam = this._teamService.getItem(this.props.teamId);
        const selectedTemplate: WorkItemTemplateReference = this._workItemTemplateService.getTemplate(this.props.templateId);

        const templateDropdownOptions = this.state.templates
            .filter(t => isNullOrWhiteSpace(this.props.workItemType) || stringEquals(t.workItemTypeName, this.props.workItemType, true))
            .map((template: WorkItemTemplateReference) => {
                return {
                    key: template.id.toLowerCase(),
                    text: template.name
                };
            });

        return (
            <div className={css("add-new-relation-picker", this.props.className)}>
                <div className="action-property-control checkbox-control">
                    <Checkbox
                        className="auto-accept"
                        label=""
                        checked={this.props.autoCreate}
                        onChange={this._onAutoCreateChange}
                    />

                    <InfoLabel
                        label="Auto create work item?"
                        info="If checked, this action will automatically create work item via rest API. If not, then it will popup a work item dialog and users will have to manually save the workitem from there."
                    />
                </div>
                <WorkItemTypePicker
                    className="action-property-control"
                    selectedOption={selectedWit}
                    selectedValue={this.props.workItemType}
                    onChange={this._onWorkItemTypeChange}
                    label="Work item type"
                    info="Select a work item type for the linked workitem"
                    delay={200}
                    required={true}
                />
                <WorkItemRelationTypePicker
                    className="action-property-control"
                    selectedOption={selectedRelationType}
                    selectedValue={this.props.relationType}
                    onChange={this._onWorkItemRelationTypeChange}
                    label="Work item relation type"
                    info="Select a work item relation type to link the workitems"
                    delay={200}
                    required={true}
                />
                <TeamPicker
                    className="action-property-control"
                    selectedOption={selectedTeam}
                    selectedValue={this.props.teamId}
                    onChange={this._onTeamChange}
                    label="Team"
                    info="Select a team to pick its work item templates"
                    delay={200}
                    required={true}
                />

                <div className="template-info-container">
                    <InfoLabel
                        label="Work item template"
                        info="Select a work item template that would be applied during linked work item creation. Supported macros in template - @fieldValue, @me, @today."
                    />
                    {selectedTeam && <Link href={this._getTemplatePageUrl(this.props.teamId, this.props.workItemType)} target="_blank">Add a template</Link>}
                </div>
                <Dropdown
                    selectedKey={this.props.templateId.toLowerCase()}
                    onRenderList={this._onRenderCallout}
                    options={templateDropdownOptions}
                    onChanged={this._onTemplateChange}
                />

                {!this.props.templateId && <InputError error="A work item template is required." />}
                {this.props.templateId && !selectedTemplate && <InputError error="This template doesnt exist." />}
            </div>
        );
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._teamService, this._workItemTypeService, this._workItemRelationTypeService, this._workItemTemplateService];
    }

    protected getDataServiceState(): IAddNewRelationActionRendererState {
        return {
            loading: this._workItemTypeService.isLoading() || this._teamService.isLoading() || this._workItemRelationTypeService.isLoading(),
            templates: this._workItemTemplateService.getItem(this.props.teamId || "") || []
        };
    }

    protected getInitialState(): IAddNewRelationActionRendererState {
        return {
            loading: true,
            templates: []
        };
    }

    private _getTemplatePageUrl(teamId: string, workItemType?: string): string {
        const webContext = VSS.getWebContext();
        let url = `${webContext.collection.uri}/${webContext.project.id}/${teamId}/_admin/_work?_a=templates`;
        if (workItemType) {
            url = `${url}&type=${workItemType}`;
        }

        return url;
    }

    private async _loadTemplates(teamId: string) {
        try {
            await this._workItemTemplateService.initializeWorkItemTemplates(teamId);
        }
        catch {
            // eat
        }
    }

    private _onRenderCallout = (props?: IDropdownProps, defaultRender?: (props?: IDropdownProps) => JSX.Element): JSX.Element => {
        return (
            <div className="callout-container">
                {defaultRender(props)}
            </div>
        );
    }

    private _onWorkItemTypeChange = (witType: WorkItemType, value?: string) => {
        this.props.onWorkItemTypeChange(witType ? witType.name : value);
    }

    private _onWorkItemRelationTypeChange = (witRelationType: WorkItemRelationType, value?: string) => {
        this.props.onRelationTypeChange(witRelationType ? witRelationType.name : value);
    }

    private _onTeamChange = (team: WebApiTeam, value?: string) => {
        this.props.onTeamChange(team ? team.id : value);
    }

    private _onTemplateChange = (option: IDropdownOption) => {
        this.props.onTemplateChange(option.key as string);
    }

    private _onAutoCreateChange = (_ev: React.FormEvent<HTMLElement>, isChecked: boolean) => {
        this.props.onAutoCreateChange(isChecked);
    }
}
