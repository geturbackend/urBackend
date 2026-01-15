import { ComponentType } from 'react';
import { AxisInterval, AxisTick, BaseAxisProps, PresentationAttributesAdaptChildEvent } from '../util/types';
import { YAxisOrientation, YAxisPadding, YAxisWidth } from '../state/cartesianAxisSlice';
interface YAxisProps extends BaseAxisProps {
    /** The unique id of y-axis */
    yAxisId?: string | number;
    /**
     * Ticks can be any type when the axis is the type of category
     * Ticks must be numbers when the axis is the type of number
     */
    ticks?: ReadonlyArray<AxisTick>;
    /**
     * The width of axis, which need to be set by user.
     * When set to 'auto', the width will be calculated dynamically based on tick labels and axis labels.
     */
    width?: YAxisWidth;
    /**
     * @defaultValue false
     */
    mirror?: boolean;
    /**
     * @defaultValue left
     */
    orientation?: YAxisOrientation;
    /**
     * @defaultValue {"top":0,"bottom":0}
     */
    padding?: YAxisPadding;
    /**
     * The minimum gap between two adjacent tick labels
     *
     * @defaultValue 5
     */
    minTickGap?: number;
    /**
     * If set 0, all the ticks will be shown. If set "preserveStart", "preserveEnd" or "preserveStartEnd",
     * the ticks which is to be shown or hidden will be calculated automatically.
     *
     * @defaultValue preserveEnd
     */
    interval?: AxisInterval;
    /**
     * @defaultValue false
     */
    reversed?: boolean;
    tickMargin?: number;
    /**
     * The rotate angle of tick
     *
     * @defaultValue 0
     */
    angle?: number;
}
export type Props = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'scale' | 'ref'> & YAxisProps;
export declare const yAxisDefaultProps: {
    readonly allowDataOverflow: boolean;
    readonly allowDecimals: boolean;
    readonly allowDuplicatedCategory: boolean;
    readonly angle: number;
    readonly axisLine: true;
    readonly hide: false;
    readonly includeHidden: boolean;
    readonly interval: AxisInterval;
    readonly minTickGap: number;
    readonly mirror: boolean;
    readonly orientation: YAxisOrientation;
    readonly padding: YAxisPadding;
    readonly reversed: boolean;
    readonly scale: import("../util/types").ScaleType | import("../util/ChartUtils").RechartsScale | undefined;
    readonly tick: import("../util/types").TickProp;
    readonly tickCount: number | undefined;
    readonly tickLine: true;
    readonly tickSize: 6;
    readonly type: import("../util/types").AxisDomainType;
    readonly width: YAxisWidth;
    readonly yAxisId: 0;
};
export declare const YAxis: ComponentType<Props>;
export {};
