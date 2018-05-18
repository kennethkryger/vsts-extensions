import * as React from "react";

import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";
import { IReactAppContext } from "Common/Utilities/Context";
import { CategoryRange, NumericValueRange, ValueSpinner } from "./ValueSpinner";

export interface ITimeProps extends IVssComponentProps {
    hour: number;
    minute: number;
    onSelectTime?(hour: number, minute: number): void;
}
export interface ITimeState extends IVssComponentState {
    hour: number;
    minute: number;
    isAM: boolean;
}

class NumberSpinner extends ValueSpinner<number> {

}
class StringSpinner extends ValueSpinner<string> {

}

export class Time extends VssComponent<ITimeProps, ITimeState> {
    private _minHour: number;
    private _maxHour: number;
    private _hourRange: NumericValueRange;
    private _minuteRange: NumericValueRange;
    private _AMPMRange: CategoryRange;

    public componentWillReceiveProps(props: ITimeProps, context?: IReactAppContext) {
        super.componentWillReceiveProps(props, context);

        if (this.props && (this.props.hour !== props.hour || this.props.minute !== props.minute)) {
            const newTime = this._calculateTimeRange(props);
            this.setState({
                hour: newTime.hour,
                minute: newTime.minute,
                isAM: newTime.isAM
            });
        }
    }

    public render(): JSX.Element {
        return (
            <div className="time-control">
                {this._renderHour()}
                {this._renderMinute()}
                {this._renderAMPM()}
            </div>
        );
    }

    protected getInitialState(props: ITimeProps) {
        this._minHour = 1;
        this._maxHour = 12;
        this._hourRange = new NumericValueRange(this._minHour, this._maxHour);
        this._minuteRange = new NumericValueRange(0, 59, (n: number) => (n < 10) ? `0${n}` : n.toString());
        this._AMPMRange = new CategoryRange(["AM", "PM"]);
        return this._calculateTimeRange(props);
    }

    private _renderAMPM(): JSX.Element {
        const value = this.state.isAM ? "AM" : "PM";

        return (
            <div className="time-ampm">
                <StringSpinner
                    value={value}
                    valueRange={this._AMPMRange}
                    onValueChange={this._onAMPMChange}
                />
            </div>
        );
    }

    private _renderHour(): JSX.Element {
        return (
            <div className="time-hour">
                <NumberSpinner
                    value={this.state.hour}
                    valueRange={this._hourRange}
                    onValueChange={this._onHourChange}
                />
            </div>
        );
    }

    private _renderMinute(): JSX.Element {
        return (
            <div className="time-minute">
                <NumberSpinner
                    value={this.state.minute}
                    valueRange={this._minuteRange}
                    onValueChange={this._onMinuteChange}
                />
            </div>
        );
    }

    private _calculateTimeRange(props: ITimeProps): ITimeState {
        const { hour, minute } = props;

        let displayedHour = hour;
        let isAM = true;

        if (hour === 0) {
            displayedHour = 12;
        }
        else if (hour >= 12) {
            isAM = false;
            if (hour > 12) {
                displayedHour = hour - 12;
            }
        }

        return {
            hour: displayedHour,
            minute: minute,
            isAM: isAM
        } as ITimeState;
    }

    private _changeTime(hour: number, minute: number, isAM: boolean) {
        this.setState({
            hour: hour,
            minute: minute,
            isAM: isAM
        });

        if (this.props.onSelectTime) {
            let h = hour;
            if (!isAM && hour !== 12) {
                h = hour + 12;
            }
            else if (isAM && hour === 12) {
                h = 0;
            }
            this.props.onSelectTime(h, minute);
        }
    }

    private _onHourChange = (value: number) => {
        this._changeTime(value, this.state.minute, this.state.isAM);
    }

    private _onMinuteChange = (value: number) => {
        this._changeTime(this.state.hour, value, this.state.isAM);
    }

    private _onAMPMChange = (value: string) => {
        const isAM = value && value.toLowerCase() === "am";
        this._changeTime(this.state.hour, this.state.minute, isAM);
    }
}
