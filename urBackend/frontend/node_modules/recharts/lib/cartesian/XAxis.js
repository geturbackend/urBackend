"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.xAxisDefaultProps = exports.XAxis = void 0;
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _clsx = require("clsx");
var _CartesianAxis = require("./CartesianAxis");
var _hooks = require("../state/hooks");
var _cartesianAxisSlice = require("../state/cartesianAxisSlice");
var _axisSelectors = require("../state/selectors/axisSelectors");
var _selectChartOffsetInternal = require("../state/selectors/selectChartOffsetInternal");
var _PanoramaContext = require("../context/PanoramaContext");
var _resolveDefaultProps = require("../util/resolveDefaultProps");
var _axisPropsAreEqual = require("../util/axisPropsAreEqual");
var _excluded = ["dangerouslySetInnerHTML", "ticks"],
  _excluded2 = ["id"];
/**
 * @fileOverview X Axis
 */
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function SetXAxisSettings(settings) {
  var dispatch = (0, _hooks.useAppDispatch)();
  var prevSettingsRef = (0, _react.useRef)(null);
  (0, _react.useLayoutEffect)(() => {
    if (prevSettingsRef.current === null) {
      dispatch((0, _cartesianAxisSlice.addXAxis)(settings));
    } else if (prevSettingsRef.current !== settings) {
      dispatch((0, _cartesianAxisSlice.replaceXAxis)({
        prev: prevSettingsRef.current,
        next: settings
      }));
    }
    prevSettingsRef.current = settings;
  }, [settings, dispatch]);
  (0, _react.useLayoutEffect)(() => {
    return () => {
      if (prevSettingsRef.current) {
        dispatch((0, _cartesianAxisSlice.removeXAxis)(prevSettingsRef.current));
        prevSettingsRef.current = null;
      }
    };
  }, [dispatch]);
  return null;
}
var XAxisImpl = props => {
  var {
    xAxisId,
    className
  } = props;
  var viewBox = (0, _hooks.useAppSelector)(_selectChartOffsetInternal.selectAxisViewBox);
  var isPanorama = (0, _PanoramaContext.useIsPanorama)();
  var axisType = 'xAxis';
  var scale = (0, _hooks.useAppSelector)(state => (0, _axisSelectors.selectAxisScale)(state, axisType, xAxisId, isPanorama));
  var cartesianTickItems = (0, _hooks.useAppSelector)(state => (0, _axisSelectors.selectTicksOfAxis)(state, axisType, xAxisId, isPanorama));
  var axisSize = (0, _hooks.useAppSelector)(state => (0, _axisSelectors.selectXAxisSize)(state, xAxisId));
  var position = (0, _hooks.useAppSelector)(state => (0, _axisSelectors.selectXAxisPosition)(state, xAxisId));
  /*
   * Here we select settings from the store and prefer to use them instead of the actual props
   * so that the chart is consistent. If we used the props directly, some components will use axis settings
   * from state and some from props and because there is a render step between these two, they might be showing different things.
   * https://github.com/recharts/recharts/issues/6257
   */
  var synchronizedSettings = (0, _hooks.useAppSelector)(state => (0, _axisSelectors.selectXAxisSettingsNoDefaults)(state, xAxisId));
  if (axisSize == null || position == null || synchronizedSettings == null) {
    return null;
  }
  var {
      dangerouslySetInnerHTML,
      ticks
    } = props,
    allOtherProps = _objectWithoutProperties(props, _excluded);
  var {
      id
    } = synchronizedSettings,
    restSynchronizedSettings = _objectWithoutProperties(synchronizedSettings, _excluded2);
  return /*#__PURE__*/React.createElement(_CartesianAxis.CartesianAxis, _extends({}, allOtherProps, restSynchronizedSettings, {
    scale: scale,
    x: position.x,
    y: position.y,
    width: axisSize.width,
    height: axisSize.height,
    className: (0, _clsx.clsx)("recharts-".concat(axisType, " ").concat(axisType), className),
    viewBox: viewBox,
    ticks: cartesianTickItems,
    axisType: axisType
  }));
};
var xAxisDefaultProps = exports.xAxisDefaultProps = {
  allowDataOverflow: _axisSelectors.implicitXAxis.allowDataOverflow,
  allowDecimals: _axisSelectors.implicitXAxis.allowDecimals,
  allowDuplicatedCategory: _axisSelectors.implicitXAxis.allowDuplicatedCategory,
  angle: _axisSelectors.implicitXAxis.angle,
  axisLine: _CartesianAxis.defaultCartesianAxisProps.axisLine,
  height: _axisSelectors.implicitXAxis.height,
  hide: false,
  includeHidden: _axisSelectors.implicitXAxis.includeHidden,
  interval: _axisSelectors.implicitXAxis.interval,
  minTickGap: _axisSelectors.implicitXAxis.minTickGap,
  mirror: _axisSelectors.implicitXAxis.mirror,
  orientation: _axisSelectors.implicitXAxis.orientation,
  padding: _axisSelectors.implicitXAxis.padding,
  reversed: _axisSelectors.implicitXAxis.reversed,
  scale: _axisSelectors.implicitXAxis.scale,
  tick: _axisSelectors.implicitXAxis.tick,
  tickCount: _axisSelectors.implicitXAxis.tickCount,
  tickLine: _CartesianAxis.defaultCartesianAxisProps.tickLine,
  tickSize: _CartesianAxis.defaultCartesianAxisProps.tickSize,
  type: _axisSelectors.implicitXAxis.type,
  xAxisId: 0
};
var XAxisSettingsDispatcher = outsideProps => {
  var props = (0, _resolveDefaultProps.resolveDefaultProps)(outsideProps, xAxisDefaultProps);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SetXAxisSettings, {
    allowDataOverflow: props.allowDataOverflow,
    allowDecimals: props.allowDecimals,
    allowDuplicatedCategory: props.allowDuplicatedCategory,
    angle: props.angle,
    dataKey: props.dataKey,
    domain: props.domain,
    height: props.height,
    hide: props.hide,
    id: props.xAxisId,
    includeHidden: props.includeHidden,
    interval: props.interval,
    minTickGap: props.minTickGap,
    mirror: props.mirror,
    name: props.name,
    orientation: props.orientation,
    padding: props.padding,
    reversed: props.reversed,
    scale: props.scale,
    tick: props.tick,
    tickCount: props.tickCount,
    tickFormatter: props.tickFormatter,
    ticks: props.ticks,
    type: props.type,
    unit: props.unit
  }), /*#__PURE__*/React.createElement(XAxisImpl, props));
};
var XAxis = exports.XAxis = /*#__PURE__*/React.memo(XAxisSettingsDispatcher, _axisPropsAreEqual.axisPropsAreEqual);
XAxis.displayName = 'XAxis';