/**
 * @fileOverview Rectangle
 */
import * as React from 'react';
import { SVGProps } from 'react';
import { AnimationDuration } from '../util/types';
import { EasingInput } from '../animation/easing';
export type RectRadius = [number, number, number, number];
interface RectangleProps {
    className?: string;
    /**
     * @defaultValue 0
     */
    x?: number;
    /**
     * @defaultValue 0
     */
    y?: number;
    /**
     * @defaultValue 0
     */
    width?: number;
    /**
     * @defaultValue 0
     */
    height?: number;
    /**
     * @defaultValue 0
     */
    radius?: number | RectRadius;
    /**
     * @defaultValue false
     */
    isAnimationActive?: boolean;
    /**
     * @defaultValue false
     */
    isUpdateAnimationActive?: boolean;
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
    animationEasing?: EasingInput;
}
export type Props = Omit<SVGProps<SVGPathElement>, 'radius'> & RectangleProps;
export declare const defaultRectangleProps: {
    readonly x: 0;
    readonly y: 0;
    readonly width: 0;
    readonly height: 0;
    readonly radius: 0;
    readonly isAnimationActive: false;
    readonly isUpdateAnimationActive: false;
    readonly animationBegin: 0;
    readonly animationDuration: 1500;
    readonly animationEasing: "ease";
};
export declare const Rectangle: React.FC<Props>;
export {};
