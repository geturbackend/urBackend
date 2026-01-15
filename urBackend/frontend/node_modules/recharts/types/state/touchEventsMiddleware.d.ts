import * as React from 'react';
export declare const touchEventAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<React.TouchEvent<HTMLDivElement>, string>;
export declare const touchEventMiddleware: import("@reduxjs/toolkit").ListenerMiddlewareInstance<import("redux").CombinedState<{
    brush: import("./brushSlice").BrushSettings;
    cartesianAxis: {
        xAxis: Record<import("./cartesianAxisSlice").AxisId, import("./cartesianAxisSlice").XAxisSettings>;
        yAxis: Record<import("./cartesianAxisSlice").AxisId, import("./cartesianAxisSlice").YAxisSettings>;
        zAxis: Record<import("./cartesianAxisSlice").AxisId, import("./cartesianAxisSlice").ZAxisSettings>;
    };
    chartData: import("./chartDataSlice").ChartDataState;
    errorBars: import("./errorBarSlice").ErrorBarsState;
    graphicalItems: import("./graphicalItemsSlice").GraphicalItemsState;
    layout: {
        layoutType: import("../util/types").LayoutType;
        width: number;
        height: number;
        margin: import("../util/types").Margin;
        scale: number;
    };
    legend: {
        settings: import("./legendSlice").LegendSettings;
        size: import("../util/types").Size;
        payload: ReadonlyArray<ReadonlyArray<import("..").LegendPayload>>;
    };
    options: import("./optionsSlice").ChartOptions;
    polarAxis: {
        radiusAxis: Record<import("./cartesianAxisSlice").AxisId, import("./polarAxisSlice").RadiusAxisSettings>;
        angleAxis: Record<import("./cartesianAxisSlice").AxisId, import("./polarAxisSlice").AngleAxisSettings>;
    };
    polarOptions: import("./polarOptionsSlice").PolarChartOptions | null;
    referenceElements: {
        dots: ReadonlyArray<import("./referenceElementsSlice").ReferenceDotSettings>;
        areas: ReadonlyArray<import("./referenceElementsSlice").ReferenceAreaSettings>;
        lines: ReadonlyArray<import("./referenceElementsSlice").ReferenceLineSettings>;
    };
    rootProps: import("./rootPropsSlice").UpdatableChartOptions;
    tooltip: import("./tooltipSlice").TooltipState;
    zIndex: {
        zIndexMap: Record<number, {
            elementId: string | undefined;
            panoramaElementId: string | undefined;
            consumers: number;
        }>;
    };
}>, import("@reduxjs/toolkit").ThunkDispatch<import("redux").CombinedState<{
    brush: import("./brushSlice").BrushSettings;
    cartesianAxis: {
        xAxis: Record<import("./cartesianAxisSlice").AxisId, import("./cartesianAxisSlice").XAxisSettings>;
        yAxis: Record<import("./cartesianAxisSlice").AxisId, import("./cartesianAxisSlice").YAxisSettings>;
        zAxis: Record<import("./cartesianAxisSlice").AxisId, import("./cartesianAxisSlice").ZAxisSettings>;
    };
    chartData: import("./chartDataSlice").ChartDataState;
    errorBars: import("./errorBarSlice").ErrorBarsState;
    graphicalItems: import("./graphicalItemsSlice").GraphicalItemsState;
    layout: {
        layoutType: import("../util/types").LayoutType;
        width: number;
        height: number;
        margin: import("../util/types").Margin;
        scale: number;
    };
    legend: {
        settings: import("./legendSlice").LegendSettings;
        size: import("../util/types").Size;
        payload: ReadonlyArray<ReadonlyArray<import("..").LegendPayload>>;
    };
    options: import("./optionsSlice").ChartOptions;
    polarAxis: {
        radiusAxis: Record<import("./cartesianAxisSlice").AxisId, import("./polarAxisSlice").RadiusAxisSettings>;
        angleAxis: Record<import("./cartesianAxisSlice").AxisId, import("./polarAxisSlice").AngleAxisSettings>;
    };
    polarOptions: import("./polarOptionsSlice").PolarChartOptions | null;
    referenceElements: {
        dots: ReadonlyArray<import("./referenceElementsSlice").ReferenceDotSettings>;
        areas: ReadonlyArray<import("./referenceElementsSlice").ReferenceAreaSettings>;
        lines: ReadonlyArray<import("./referenceElementsSlice").ReferenceLineSettings>;
    };
    rootProps: import("./rootPropsSlice").UpdatableChartOptions;
    tooltip: import("./tooltipSlice").TooltipState;
    zIndex: {
        zIndexMap: Record<number, {
            elementId: string | undefined;
            panoramaElementId: string | undefined;
            consumers: number;
        }>;
    };
}>, unknown, import("redux").AnyAction>, unknown>;
