import * as React from 'react';
import { CSSProperties, ReactElement, ReactNode } from 'react';
import { NameType, Payload, Props as DefaultTooltipContentProps, ValueType } from './DefaultTooltipContent';
import { UniqueOption } from '../util/payload/getUniqPayload';
import { AllowInDimension, AnimationDuration, AnimationTiming, Coordinate } from '../util/types';
import { CursorDefinition } from './Cursor';
import { TooltipTrigger } from '../chart/types';
import { TooltipIndex } from '../state/tooltipSlice';
import { AxisId } from '../state/cartesianAxisSlice';
export type ContentType<TValue extends ValueType, TName extends NameType> = ReactElement | ((props: TooltipContentProps<TValue, TName>) => ReactNode);
export type TooltipContentProps<TValue extends ValueType, TName extends NameType> = TooltipProps<TValue, TName> & {
    label?: string | number;
    payload: ReadonlyArray<any>;
    coordinate: Coordinate | undefined;
    active: boolean;
    accessibilityLayer: boolean;
    activeIndex: TooltipIndex | undefined;
};
type PropertiesReadFromContext = 'viewBox' | 'active' | 'payload' | 'coordinate' | 'label' | 'accessibilityLayer';
export type TooltipProps<TValue extends ValueType, TName extends NameType> = Omit<DefaultTooltipContentProps<TValue, TName>, PropertiesReadFromContext> & {
    /**
     * If true, then Tooltip is always displayed, once an activeIndex is set by mouse over, or programmatically.
     * If false, then Tooltip is never displayed.
     * If active is undefined, Recharts will control when the Tooltip displays. This includes mouse and keyboard controls.
     *
     * @defaultValue undefined
     */
    active?: boolean;
    /**
     * @defaultValue {"x":false,"y":false}
     */
    allowEscapeViewBox?: AllowInDimension;
    /**
     * @defaultValue 400
     */
    animationDuration?: AnimationDuration;
    /**
     * @defaultValue ease
     */
    animationEasing?: AnimationTiming;
    /**
     * Tooltip always attaches itself to the "Tooltip" axis. Which axis is it? Depends on the layout:
     * - horizontal layout -> X axis
     * - vertical layout -> Y axis
     * - radial layout -> radial axis
     * - centric layout -> angle axis
     *
     * Tooltip will use the default axis for the layout, unless you specify an axisId.
     *
     * @defaultValue 0
     */
    axisId?: AxisId;
    content?: ContentType<TValue, TName>;
    /**
     * @defaultValue true
     */
    cursor?: CursorDefinition;
    defaultIndex?: number | TooltipIndex;
    /**
     * @defaultValue true
     */
    filterNull?: boolean;
    /**
     * If true, then Tooltip will information about hidden series (defaults to false).
     * Interacting with the hide property of Area, Bar, Line, Scatter.
     *
     * @defaultValue false
     */
    includeHidden?: boolean | undefined;
    /**
     * @defaultValue auto
     */
    isAnimationActive?: boolean | 'auto';
    /**
     * @defaultValue 10
     */
    offset?: number;
    payloadUniqBy?: UniqueOption<Payload<TValue, TName>>;
    /**
     * If portal is defined, then Tooltip will use this element as a target
     * for rendering using React Portal: https://react.dev/reference/react-dom/createPortal
     *
     * If this is undefined then Tooltip renders inside the recharts-wrapper element.
     */
    portal?: HTMLElement | null;
    position?: Partial<Coordinate>;
    /**
     * @defaultValue {"x":false,"y":false}
     */
    reverseDirection?: AllowInDimension;
    /**
     * If true, tooltip will appear on top of all bars on an axis tick.
     * If false, tooltip will appear on individual bars.
     */
    shared?: boolean;
    /**
     * If `hover` then the Tooltip shows on mouse enter and hides on mouse leave.
     *
     * If `click` then the Tooltip shows after clicking and stays active.
     *
     * @defaultValue hover
     */
    trigger?: TooltipTrigger;
    /**
     * @defaultValue false
     */
    useTranslate3d?: boolean;
    wrapperStyle?: CSSProperties;
};
export declare const defaultTooltipProps: {
    readonly allowEscapeViewBox: {
        readonly x: false;
        readonly y: false;
    };
    readonly animationDuration: 400;
    readonly animationEasing: "ease";
    readonly axisId: 0;
    readonly contentStyle: {};
    readonly cursor: true;
    readonly filterNull: true;
    readonly isAnimationActive: "auto";
    readonly itemSorter: "name";
    readonly itemStyle: {};
    readonly labelStyle: {};
    readonly offset: 10;
    readonly reverseDirection: {
        readonly x: false;
        readonly y: false;
    };
    readonly separator: " : ";
    readonly trigger: "hover";
    readonly useTranslate3d: false;
    readonly wrapperStyle: {};
};
export declare function Tooltip<TValue extends ValueType, TName extends NameType>(outsideProps: TooltipProps<TValue, TName>): React.JSX.Element | null;
export {};
