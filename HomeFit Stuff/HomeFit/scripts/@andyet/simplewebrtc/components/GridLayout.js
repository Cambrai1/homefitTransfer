"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = require("react");
var GRID_AREAS = 'abcdefghijklmnopqrstuvwxyz';
function getGridTemplateAreas(numberOfStreams) {
    if (numberOfStreams === 1) {
        return "\"a\"";
    }
    else if (numberOfStreams === 2) {
        return "\"a b\"";
    }
    else if (numberOfStreams === 3) {
        return "\"a b\" \"a c\"";
    }
    var columns = Math.ceil(Math.pow(numberOfStreams, 0.5));
    var rows = Math.ceil(numberOfStreams / columns);
    var gridTemplateRows = [];
    for (var i = 0; i < rows; i++) {
        var row = '';
        for (var j = 0; j < columns; j++) {
            row += GRID_AREAS.charAt(i * columns + j);
        }
        gridTemplateRows.push("\"" + row.split('').join(' ') + "\"");
    }
    return gridTemplateRows.join(' ');
}
function getGridTemplateColumns(numberOfStreams) {
    return Math.ceil(Math.pow(numberOfStreams, 0.5));
}
function getGridTemplateRows(numberOfStreams) {
    return Math.ceil(numberOfStreams / Math.ceil(Math.pow(numberOfStreams, 0.5)));
}
function getGridArea(index) {
    return GRID_AREAS.charAt(index);
}
function CellContainer(props) {
    return (React.createElement("div", { style: {
            display: 'flex',
            gridArea: getGridArea(props.index),
            overflow: 'hidden'
        } }, props.content));
}
function GridContainer(props) {
    return (React.createElement("div", { id: props.id, className: props.className, style: {
            display: 'grid',
            gridTemplateAreas: getGridTemplateAreas(props.itemCount),
            gridTemplateColumns: "repeat(" + getGridTemplateColumns(props.itemCount) + ", 1fr)",
            gridTemplateRows: "repeat(" + getGridTemplateRows(props.itemCount) + ", 1fr)"
        } }, props.content));
}
/**
 * @description
 *
 * @public
 *
 */
var GridLayout = /** @class */ (function (_super) {
    tslib_1.__extends(GridLayout, _super);
    function GridLayout() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GridLayout.prototype.render = function () {
        var e_1, _a;
        var items = this.props.items;
        var rendered = [];
        var index = 0;
        try {
            for (var items_1 = tslib_1.__values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
                var item = items_1_1.value;
                var renderedItem = this.props.renderCell(item);
                if (renderedItem) {
                    rendered.push((React.createElement(CellContainer, { index: index, key: index, content: renderedItem })));
                    index += 1;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return (React.createElement(GridContainer, { id: this.props.id, className: this.props.className, itemCount: rendered.length, content: rendered }));
    };
    return GridLayout;
}(React.Component));
exports.default = GridLayout;
