/**
 * @fileOverview Rectangle
 */
import * as React from 'react';
import { SVGProps } from 'react';
import { AnimationDuration, AnimationTiming } from '../util/types';
interface TrapezoidProps {
    className?: string;
    x?: number;
    y?: number;
    upperWidth?: number;
    lowerWidth?: number;
    height?: number;
    isUpdateAnimationActive?: boolean;
    animationBegin?: number;
    animationDuration?: AnimationDuration;
    animationEasing?: AnimationTiming;
}
export type Props = SVGProps<SVGPathElement> & TrapezoidProps;
export declare const defaultTrapezoidProps: {
    readonly x: 0;
    readonly y: 0;
    readonly upperWidth: 0;
    readonly lowerWidth: 0;
    readonly height: 0;
    readonly isUpdateAnimationActive: false;
    readonly animationBegin: 0;
    readonly animationDuration: 1500;
    readonly animationEasing: "ease";
};
export declare const Trapezoid: React.FC<Props>;
export {};
