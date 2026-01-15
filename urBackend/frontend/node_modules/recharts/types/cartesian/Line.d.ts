import { ComponentType } from 'react';
import { CurveType, Props as CurveProps } from '../shape/Curve';
import { ImplicitLabelListType } from '../component/LabelList';
import { ActiveDotType, ActiveShape, AnimationDuration, AnimationTiming, CartesianLayout, DataKey, DotType, LegendType, TickItem, TooltipType } from '../util/types';
import { BaseAxisWithScale } from '../state/selectors/axisSelectors';
import { AxisId } from '../state/cartesianAxisSlice';
import { ZIndexable } from '../zIndex/ZIndexLayer';
export interface LinePointItem {
    readonly value: number;
    readonly payload?: any;
    /**
     * Line coordinates can have gaps in them. We have `connectNulls` prop that allows to connect those gaps anyway.
     * What it means is that some points can have `null` x or y coordinates.
     */
    x: number | null;
    y: number | null;
}
/**
 * External props, intended for end users to fill in
 */
interface LineProps extends ZIndexable {
    activeDot?: ActiveDotType;
    /**
     * @defaultValue true
     */
    animateNewValues?: boolean;
    /**
     * @defaultValue 0
     */
    animationBegin?: number;
    /**
     * @defaultValue 1500
     */
    animationDuration?: AnimationDuration;
    /**
     * @defaultValue ease
     */
    animationEasing?: AnimationTiming;
    className?: string;
    /**
     * @defaultValue false
     */
    connectNulls?: boolean;
    data?: any;
    dataKey?: DataKey<any>;
    /**
     * @defaultValue true
     */
    dot?: DotType;
    /**
     * @defaultValue false
     */
    hide?: boolean;
    id?: string;
    /**
     * @defaultValue auto
     */
    isAnimationActive?: boolean | 'auto';
    /**
     * @defaultValue false
     */
    label?: ImplicitLabelListType;
    /**
     * @defaultValue line
     */
    legendType?: LegendType;
    shape?: ActiveShape<CurveProps, SVGPathElement>;
    name?: string | number;
    onAnimationEnd?: () => void;
    onAnimationStart?: () => void;
    tooltipType?: TooltipType;
    /**
     * @defaultValue linear
     */
    type?: CurveType;
    unit?: string | number | null;
    /**
     * @defaultValue 0
     */
    xAxisId?: AxisId;
    /**
     * @defaultValue 0
     */
    yAxisId?: AxisId;
    /**
     * @defaultValue 400
     */
    zIndex?: number;
}
/**
 * Because of naming conflict, we are forced to ignore certain (valid) SVG attributes.
 */
type LineSvgProps = Omit<CurveProps, 'points' | 'pathRef' | 'ref' | 'layout'>;
export type Props = LineSvgProps & LineProps;
export declare const defaultLineProps: {
    readonly activeDot: true;
    readonly animateNewValues: true;
    readonly animationBegin: 0;
    readonly animationDuration: 1500;
    readonly animationEasing: "ease";
    readonly connectNulls: false;
    readonly dot: true;
    readonly fill: "#fff";
    readonly hide: false;
    readonly isAnimationActive: "auto";
    readonly label: false;
    readonly legendType: "line";
    readonly stroke: "#3182bd";
    readonly strokeWidth: 1;
    readonly xAxisId: 0;
    readonly yAxisId: 0;
    readonly zIndex: 400;
    readonly type: "linear";
};
export declare function computeLinePoints({ layout, xAxis, yAxis, xAxisTicks, yAxisTicks, dataKey, bandSize, displayedData, }: {
    layout: CartesianLayout;
    xAxis: BaseAxisWithScale;
    yAxis: BaseAxisWithScale;
    xAxisTicks: TickItem[];
    yAxisTicks: TickItem[];
    dataKey: Props['dataKey'];
    bandSize: number;
    displayedData: any[];
}): ReadonlyArray<LinePointItem>;
export declare const Line: ComponentType<Props>;
export {};
