'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _column = require('./column');

var _column2 = _interopRequireDefault(_column);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var SimpleColumn = function (_Column) {
  _inherits(SimpleColumn, _Column);

  function SimpleColumn(name, attributeName, columnName) {
    _classCallCheck(this, SimpleColumn);

    var _this = _possibleConstructorReturn(this, _Column.call(this));

    _this._name = name;
    _this._attributeName = attributeName;
    _this._columnName = columnName;
    return _this;
  }

  SimpleColumn.prototype.valueFrom = function valueFrom(row) {
    return row[this.attributeName];
  };

  _createClass(SimpleColumn, [{
    key: 'id',
    get: function get() {
      return this._columnName;
    }
  }, {
    key: 'name',
    get: function get() {
      return this._name;
    }
  }, {
    key: 'columnName',
    get: function get() {
      return this._columnName;
    }
  }, {
    key: 'attributeName',
    get: function get() {
      return this._attributeName;
    }
  }]);

  return SimpleColumn;
}(_column2.default);

exports.default = SimpleColumn;
//# sourceMappingURL=simple-column.js.map