import * as React from 'react';
import { ReactElement, SVGAttributes, SVGProps } from 'react';
import { DataKey, Padding } from '../util/types';
import { OnBrushUpdate } from '../context/brushUpdateContext';
type BrushTravellerType = ReactElement<SVGElement> | ((props: TravellerProps) => ReactElement<SVGElement>);
type BrushTickFormatter = (value: any, index: number) => number | string;
interface BrushProps {
    x?: number;
    y?: number;
    dy?: number;
    width?: number;
    className?: string;
    ariaLabel?: string;
    /**
     * @defaultValue 40
     */
    height?: number;
    /**
     * @defaultValue 5
     */
    travellerWidth?: number;
    traveller?: BrushTravellerType;
    /**
     * @defaultValue 1
     */
    gap?: number;
    padding?: Padding;
    dataKey?: DataKey<any>;
    startIndex?: number;
    endIndex?: number;
    tickFormatter?: BrushTickFormatter;
    children?: ReactElement;
    onChange?: OnBrushUpdate;
    onDragEnd?: OnBrushUpdate;
    /**
     * @defaultValue 1000
     */
    leaveTimeOut?: number;
    /**
     * @defaultValue false
     */
    alwaysShowText?: boolean;
}
export type Props = Omit<SVGProps<SVGElement>, 'onChange' | 'onDragEnd' | 'ref'> & BrushProps;
type TravellerProps = {
    x: number;
    y: number;
    width: number;
    height: number;
    stroke?: SVGAttributes<SVGElement>['stroke'];
};
export declare const defaultBrushProps: {
    readonly height: 40;
    readonly travellerWidth: 5;
    readonly gap: 1;
    readonly fill: "#fff";
    readonly stroke: "#666";
    readonly padding: {
        readonly top: 1;
        readonly right: 1;
        readonly bottom: 1;
        readonly left: 1;
    };
    readonly leaveTimeOut: 1000;
    readonly alwaysShowText: false;
};
export declare function Brush(outsideProps: Props): React.JSX.Element;
export declare namespace Brush {
    var displayName: string;
}
export {};
