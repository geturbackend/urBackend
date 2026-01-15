import * as React from 'react';
import { ComponentType } from 'react';
import { CurveType, Props as CurveProps } from '../shape/Curve';
import { ImplicitLabelListType } from '../component/LabelList';
import { ActiveDotType, AnimationDuration, AnimationTiming, DataKey, DotType, LegendType, NullableCoordinate, TickItem, TooltipType } from '../util/types';
import { BaseAxisWithScale } from '../state/selectors/axisSelectors';
import { ChartData } from '../state/chartDataSlice';
import { ComputedArea } from '../state/selectors/areaSelectors';
import { AreaSettings } from '../state/types/AreaSettings';
import { ZIndexable } from '../zIndex/ZIndexLayer';
export type BaseValue = number | 'dataMin' | 'dataMax';
/**
 * External props, intended for end users to fill in
 */
interface AreaProps extends ZIndexable {
    /**
     * The dot is shown when user enter an area chart and this chart has tooltip. If false set, no active dot will not be drawn. If true set, active dot will be drawn which have the props calculated internally. If object set, active dot will be drawn which have the props merged by the internal calculated props and the option. If ReactElement set, the option can be the custom active dot element.If set a function, the function will be called to render customized active dot.
     * @default true
     */
    activeDot?: ActiveDotType;
    /**
     * Specifies when the animation should begin, the unit of this option is ms.
     * @default 0
     */
    animationBegin?: number;
    /**
     * Specifies the duration of animation, the unit of this option is ms.
     * @default 1500
     */
    animationDuration?: AnimationDuration;
    /**
     * The type of easing function.
     * @default 'ease'
     */
    animationEasing?: AnimationTiming;
    /**
     * The value which can describe the line, usually calculated internally.
     */
    baseLine?: number | ReadonlyArray<NullableCoordinate>;
    baseValue?: BaseValue;
    className?: string;
    /**
     * Whether to connect a graph area across null points.
     * @default false
     */
    connectNulls?: boolean;
    data?: ChartData;
    /**
     * The key of a group of data which should be unique in an area chart.
     */
    dataKey: DataKey<any>;
    /**
     * If false set, dots will not be drawn. If true set, dots will be drawn which have the props calculated internally. If object set, dots will be drawn which have the props merged by the internal calculated props and the option. If ReactElement set, the option can be the custom dot element. If set a function, the function will be called to render customized dot.
     * @default false
     */
    dot?: DotType;
    hide?: boolean;
    /**
     * The unique id of this component, which will be used to generate unique clip path id internally. This props is suggested to be set in SSR.
     */
    id?: string;
    /**
     * If set false, animation of area will be disabled. If set "auto", the animation will be disabled in SSR and enabled in browser.
     * @default 'auto'
     */
    isAnimationActive?: boolean | 'auto';
    isRange?: boolean;
    /**
     * If false set, labels will not be drawn. If true set, labels will be drawn which have the props calculated internally. If object set, labels will be drawn which have the props merged by the internal calculated props and the option. If ReactElement set, the option can be the custom label element. If set a function, the function will be called to render customized label.
     * @default false
     */
    label?: ImplicitLabelListType;
    /**
     * The type of icon in legend.  If set to 'none', no legend item will be rendered.
     * @default 'line'
     */
    legendType?: LegendType;
    /**
     * The name of data. This option will be used in tooltip and legend to represent a area. If no value was set to this option, the value of dataKey will be used alternatively.
     */
    name?: string | number;
    /**
     * The customized event handler of animation end
     */
    onAnimationEnd?: () => void;
    /**
     * The customized event handler of animation start
     */
    onAnimationStart?: () => void;
    /**
     * The customized event handler of click on the area in this group
     */
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
    /**
     * The customized event handler of mousedown on the area in this group
     */
    onMouseDown?: (event: React.MouseEvent<SVGPathElement>) => void;
    /**
     * The customized event handler of mouseenter on the area in this group
     */
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void;
    /**
     * The customized event handler of mouseleave on the area in this group
     */
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void;
    /**
     * The customized event handler of mousemove on the area in this group
     */
    onMouseMove?: (event: React.MouseEvent<SVGPathElement>) => void;
    /**
     * The customized event handler of mouseout on the area in this group
     */
    onMouseOut?: (event: React.MouseEvent<SVGPathElement>) => void;
    /**
     * The customized event handler of mouseover on the area in this group
     */
    onMouseOver?: (event: React.MouseEvent<SVGPathElement>) => void;
    /**
     * The customized event handler of mouseup on the area in this group
     */
    onMouseUp?: (event: React.MouseEvent<SVGPathElement>) => void;
    /**
     * The stack id of area, when two areas have the same value axis and same stackId, then the two areas area stacked in order.
     */
    stackId?: string | number;
    /**
     * The stroke color. If "none", no line will be drawn.
     * @default '#3182bd'
     */
    stroke?: string;
    /**
     * The width of the stroke
     * @default 1
     */
    strokeWidth?: string | number;
    tooltipType?: TooltipType;
    /**
     * The interpolation type of area. And customized interpolation function can be set to type.
     * @default 'linear'
     */
    type?: CurveType;
    /**
     * The unit of data. This option will be used in tooltip.
     */
    unit?: string | number;
    /**
     * The id of x-axis which is corresponding to the data.
     * @default 0
     */
    xAxisId?: string | number;
    /**
     * The id of y-axis which is corresponding to the data.
     * @default 0
     */
    yAxisId?: string | number;
    /**
     * @since 3.4
     * @defaultValue 100
     */
    zIndex?: number;
}
/**
 * Because of naming conflict, we are forced to ignore certain (valid) SVG attributes.
 */
type AreaSvgProps = Omit<CurveProps, 'type' | 'points' | 'ref'>;
export type Props = AreaSvgProps & AreaProps;
export declare const defaultAreaProps: {
    readonly activeDot: true;
    readonly animationBegin: 0;
    readonly animationDuration: 1500;
    readonly animationEasing: "ease";
    readonly connectNulls: false;
    readonly dot: false;
    readonly fill: "#3182bd";
    readonly fillOpacity: 0.6;
    readonly hide: false;
    readonly isAnimationActive: "auto";
    readonly legendType: "line";
    readonly stroke: "#3182bd";
    readonly strokeWidth: 1;
    readonly type: "linear";
    readonly label: false;
    readonly xAxisId: 0;
    readonly yAxisId: 0;
    readonly zIndex: 100;
};
export declare const getBaseValue: (layout: "horizontal" | "vertical", chartBaseValue: BaseValue | undefined, itemBaseValue: BaseValue | undefined, xAxis: BaseAxisWithScale, yAxis: BaseAxisWithScale) => number;
export declare function computeArea({ areaSettings: { connectNulls, baseValue: itemBaseValue, dataKey }, stackedData, layout, chartBaseValue, xAxis, yAxis, displayedData, dataStartIndex, xAxisTicks, yAxisTicks, bandSize, }: {
    areaSettings: AreaSettings;
    stackedData: number[][] | undefined;
    layout: 'horizontal' | 'vertical';
    chartBaseValue: BaseValue | undefined;
    xAxis: BaseAxisWithScale;
    yAxis: BaseAxisWithScale;
    displayedData: ChartData;
    dataStartIndex: number;
    xAxisTicks: TickItem[];
    yAxisTicks: TickItem[];
    bandSize: number;
}): ComputedArea;
export declare const Area: ComponentType<Props>;
export {};
