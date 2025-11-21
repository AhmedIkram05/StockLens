// More realistic mock module for SVG files in Jest tests.
// Exports a React component that mimics an SVG element by
// accepting common SVG props (width, height, viewBox, fill)
// and rendering a simple View with a testID so tests can
// query and assert on it. Also exports the same component
// as `ReactComponent` so imports like `import { ReactComponent as Icon } from './icon.svg'`
// work in tests.

const React = require('react');
const { View } = require('react-native');

const SvgMock = ({ children = null, width, height, viewBox, fill, ...props }) => {
	// Render a <View> that carries the svg props so tests can inspect them.
	// We attach a testID for easy querying in react-native-testing-library.
	return React.createElement(View, {
		testID: 'svg-mock',
		accessible: false,
		// expose common SVG props as data attributes so that
		// snapshots or prop inspections can validate them.
		'data-svg-width': width,
		'data-svg-height': height,
		'data-svg-viewbox': viewBox,
		'data-svg-fill': fill,
		...props,
	}, children);
};

SvgMock.displayName = 'SvgMock';

module.exports = SvgMock;
module.exports.ReactComponent = SvgMock;
