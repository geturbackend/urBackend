import * as React from 'react';
import { ReactElement, ReactNode, SVGProps } from 'react';
import { ActiveShape, AnimationDuration, AnimationTiming, ChartOffsetInternal, Coordinate, DataKey, GeometrySector, LegendType, PresentationAttributesAdaptChildEvent, TooltipType } from '../util/types';
import { TooltipPayload } from '../state/tooltipSlice';
import { PiePresentationProps, PieSettings } from '../state/types/PieSettings';
import { SVGPropsNoEvents } from '../util/svgPropertiesNoEvents';
import { Props as LabelListProps } from '../component/LabelList';
import { ZIndexable } from '../zIndex/ZIndexLayer';
type ChartDataInput = Record<string, unknown>;
interface PieDef {
    /** The abscissa of pole in polar coordinate  */
    cx?: number | string;
    /** The ordinate of pole in polar coordinate  */
    cy?: number | string;
    /** The start angle of first sector */
    startAngle?: number;
    /** The end angle of last sector */
    endAngle?: number;
    paddingAngle?: number;
    /** The inner radius of sectors */
    innerRadius?: number | string;
    /** The outer radius of sectors */
    outerRadius?: number | string | ((dataPoint: any) => number | string);
    cornerRadius?: number | string;
}
type PieLabelLine = ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>) | SVGProps<SVGPathElement> | boolean;
interface PieLabelExtraProps {
    stroke: string;
    index: number;
    textAnchor: string;
}
export type PieLabelRenderProps = Omit<SVGPropsNoEvents<PieSvgAttributes>, 'offset'> & Omit<PieSectorDataItem, 'offset'> & PieLabelExtraProps & Coordinate;
type LabelListPropsWithPosition = LabelListProps & {
    position: LabelListProps['position'];
};
/**
 * The `label` prop in Pie accepts a variety of alternatives.
 */
export type PieLabel = boolean | LabelListPropsWithPosition | Partial<PieLabelRenderProps> | ((props: PieLabelRenderProps) => ReactNode | ReactElement<SVGElement>) | ReactElement<SVGElement>;
export type PieSectorData = GeometrySector & {
    dataKey?: DataKey<any>;
    midAngle?: number;
    middleRadius?: number;
    name?: string | number;
    paddingAngle?: number;
    payload?: any;
    percent?: number;
    tooltipPayload?: TooltipPayload;
    tooltipPosition: Coordinate;
    value: number;
};
/**
 * We spread the data object into the sector data item,
 * so we can't really know what is going to be inside.
 *
 * This type represents our best effort, but it all depends on the input data
 * and what is inside of it.
 *
 * https://github.com/recharts/recharts/issues/6380
 * https://github.com/recharts/recharts/discussions/6375
 */
export type PieSectorDataItem = PiePresentationProps & PieCoordinate & PieSectorData & {
    cornerRadius: number | undefined;
};
type PieSectorShapeProps = PieSectorDataItem & {
    isActive: boolean;
    index: number;
};
type PieShape = ReactNode | ((props: PieSectorShapeProps, index: number) => React.ReactElement);
interface PieProps extends PieDef, ZIndexable {
    /**
     * @deprecated use the `shape` prop to create each sector
     * `isActive` designates the "active" shape
     */
    activeShape?: ActiveShape<PieSectorDataItem>;
    /**
     * @defaultValue 400
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
    /** the input data */
    data?: ChartDataInput[];
    /**
     * @defaultValue value
     */
    dataKey?: DataKey<any>;
    /**
     * If set true, the pie will not be displayed.
     *
     * @defaultValue false
     */
    hide?: boolean;
    id?: string;
    /**
     * @deprecated use the `shape` prop to modify each sector
     */
    inactiveShape?: ActiveShape<PieSectorDataItem>;
    /**
     * @defaultValue auto
     */
    isAnimationActive?: boolean | 'auto';
    /**
     * @defaultValue false
     */
    label?: PieLabel;
    /**
     * @defaultValue true
     */
    labelLine?: PieLabelLine;
    /**
     * @defaultValue rect
     */
    legendType?: LegendType;
    /** the max radius of pie */
    maxRadius?: number;
    /**
     * The minimum angle for no-zero element
     *
     * @defaultValue 0
     */
    minAngle?: number;
    /**
     * @defaultValue name
     */
    nameKey?: DataKey<any>;
    onAnimationEnd?: () => void;
    onAnimationStart?: () => void;
    onClick?: (data: any, index: number, e: React.MouseEvent) => void;
    onMouseEnter?: (data: any, index: number, e: React.MouseEvent) => void;
    onMouseLeave?: (data: any, index: number, e: React.MouseEvent) => void;
    /**
     * @defaultValue 0
     */
    rootTabIndex?: number;
    shape?: PieShape;
    tooltipType?: TooltipType;
    /**
     * @defaultValue 100
     */
    zIndex?: number;
}
type PieSvgAttributes = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'ref'>;
export type Props = PieSvgAttributes & PieProps;
type RealPieData = any;
export type PieCoordinate = {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    maxRadius: number;
};
export declare function computePieSectors({ pieSettings, displayedData, cells, offset, }: {
    pieSettings: PieSettings;
    displayedData: ReadonlyArray<RealPieData>;
    cells: ReadonlyArray<ReactElement> | undefined;
    offset: ChartOffsetInternal;
}): ReadonlyArray<PieSectorDataItem> | undefined;
export declare const defaultPieProps: {
    readonly animationBegin: 400;
    readonly animationDuration: 1500;
    readonly animationEasing: "ease";
    readonly cx: "50%";
    readonly cy: "50%";
    readonly dataKey: "value";
    readonly endAngle: 360;
    readonly fill: "#808080";
    readonly hide: false;
    readonly innerRadius: 0;
    readonly isAnimationActive: "auto";
    readonly label: false;
    readonly labelLine: true;
    readonly legendType: "rect";
    readonly minAngle: 0;
    readonly nameKey: "name";
    readonly outerRadius: "80%";
    readonly paddingAngle: 0;
    readonly rootTabIndex: 0;
    readonly startAngle: 0;
    readonly stroke: "#fff";
    readonly zIndex: 100;
};
export declare function Pie(outsideProps: Props): React.JSX.Element;
export declare namespace Pie {
    var displayName: string;
}
export {};
