import { ComponentType } from 'react';
import { AxisInterval, AxisTick, BaseAxisProps, PresentationAttributesAdaptChildEvent } from '../util/types';
import { XAxisOrientation, XAxisPadding } from '../state/cartesianAxisSlice';
interface XAxisProps extends BaseAxisProps {
    /**
     * The unique id of x-axis.
     *
     * @defaultValue 0
     */
    xAxisId?: string | number;
    /**
     * The height of axis in pixels
     *
     * @defaultValue 30
     */
    height?: number;
    /**
     * @defaultValue false
     */
    mirror?: boolean;
    /**
     * @defaultValue bottom
     */
    orientation?: XAxisOrientation;
    /**
     * Ticks can be any type when the axis is the type of category
     * Ticks must be numbers when the axis is the type of number
     */
    ticks?: ReadonlyArray<AxisTick>;
    /**
     * @defaultValue {"left":0,"right":0}
     */
    padding?: XAxisPadding;
    /**
     * The minimum gap between two adjacent tick labels
     *
     * @defaultValue 5
     */
    minTickGap?: number;
    /**
     * @defaultValue preserveEnd
     */
    interval?: AxisInterval;
    /**
     * @defaultValue false
     */
    reversed?: boolean;
    /**
     * The rotate angle of tick
     *
     * @defaultValue 0
     */
    angle?: number;
    tickMargin?: number;
}
export type Props = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'scale' | 'ref'> & XAxisProps;
export declare const xAxisDefaultProps: {
    readonly allowDataOverflow: boolean;
    readonly allowDecimals: boolean;
    readonly allowDuplicatedCategory: boolean;
    readonly angle: number;
    readonly axisLine: true;
    readonly height: number;
    readonly hide: false;
    readonly includeHidden: boolean;
    readonly interval: AxisInterval;
    readonly minTickGap: number;
    readonly mirror: boolean;
    readonly orientation: XAxisOrientation;
    readonly padding: XAxisPadding;
    readonly reversed: boolean;
    readonly scale: import("../util/types").ScaleType | import("../util/ChartUtils").RechartsScale | undefined;
    readonly tick: import("../util/types").TickProp;
    readonly tickCount: number | undefined;
    readonly tickLine: true;
    readonly tickSize: 6;
    readonly type: import("../util/types").AxisDomainType;
    readonly xAxisId: 0;
};
export declare const XAxis: ComponentType<Props>;
export {};
