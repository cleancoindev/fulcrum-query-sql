'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _condition = require('./condition');

var _sortExpressions = require('./sort-expressions');

var _sortExpressions2 = _interopRequireDefault(_sortExpressions);

var _converter = require('./ast/converter');

var _converter2 = _interopRequireDefault(_converter);

var _columnFilter = require('./column-filter');

var _columnFilter2 = _interopRequireDefault(_columnFilter);

var _pgQueryDeparser = require('pg-query-deparser');

var _pgQueryDeparser2 = _interopRequireDefault(_pgQueryDeparser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _helpers = require('./ast/helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Query = function () {
  function Query(form, outputs, filter, sort, schema) {
    _classCallCheck(this, Query);

    this._form = form;
    this._outputs = [];
    this._schema = schema;
    this._filter = new _condition.Condition(filter, schema);
    this._columnFilters = {};
    this._sorting = new _sortExpressions2.default(sort || [], schema);
    this._boundingBox = null;
    this._searchFilter = null;
  }

  Query.prototype.columnFilter = function columnFilter(column) {
    if (this.columnFilters[column.id] == null) {
      this.columnFilters[column.id] = new _columnFilter2.default({ field: column.id }, this._schema);
    }

    return this.columnFilters[column.id];
  };

  Query.prototype.toJSON = function toJSON() {
    var _this = this;

    return {
      outputs: this.outputs.map(function (o) {
        return o.toJSON();
      }),
      filter: this.filter.toJSON(),
      sorting: this.sorting.toJSON(),
      column_filters: Object.keys(this.columnFilters).map(function (key) {
        return _this.columnFilters[key].toJSON();
      })
    };
  };

  Query.prototype.toRawAST = function toRawAST(options) {
    return new _converter2.default().toAST(this, options);
  };

  Query.prototype.toCountAST = function toCountAST(options) {
    return new _converter2.default().toCountAST(this, options);
  };

  Query.prototype.toTileAST = function toTileAST(options) {
    return new _converter2.default().toTileAST(this, options);
  };

  Query.prototype.toDistinctValuesAST = function toDistinctValuesAST(options) {
    return new _converter2.default().toDistinctValuesAST(this, options);
  };

  Query.prototype.toHistogramAST = function toHistogramAST(options) {
    return new _converter2.default().toHistogramAST(this, options);
  };

  Query.prototype.toAST = function toAST(_ref) {
    var applySort = _ref.applySort,
        pageSize = _ref.pageSize,
        pageIndex = _ref.pageIndex,
        outerLimit = _ref.outerLimit;

    var finalLimit = outerLimit ? (0, _helpers.AConst)((0, _helpers.IntegerValue)(+outerLimit)) : null;

    var sortClause = applySort ? this.outerSortClause : null;

    var fromClause = this.fromClause(_extends({ applySort: applySort, pageSize: pageSize, pageIndex: pageIndex }, this.runtimeFilters));

    return (0, _helpers.SelectStmt)({
      targetList: this.targetList(),
      fromClause: fromClause,
      sortClause: sortClause,
      limitCount: finalLimit
    });
  };

  Query.prototype.toDistinctValuesSQL = function toDistinctValuesSQL(options) {
    return new _pgQueryDeparser2.default().deparse(this.toDistinctValuesAST(options));
  };

  Query.prototype.toHistogramSQL = function toHistogramSQL(options) {
    return new _pgQueryDeparser2.default().deparse(this.toHistogramAST(options));
  };

  Query.prototype.toCountSQL = function toCountSQL() {
    return new _pgQueryDeparser2.default().deparse(this.toCountAST(this.runtimeFilters));
  };

  Query.prototype.toSQL = function toSQL(_ref2) {
    var applySort = _ref2.applySort,
        pageSize = _ref2.pageSize,
        pageIndex = _ref2.pageIndex,
        outerLimit = _ref2.outerLimit;

    var options = _extends({
      applySort: applySort,
      pageSize: pageSize,
      pageIndex: pageIndex,
      outerLimit: outerLimit
    }, this.runtimeFilters);

    return new _pgQueryDeparser2.default().deparse(this.toAST(options));
  };

  Query.prototype.toTileSQL = function toTileSQL() {
    return new _pgQueryDeparser2.default().deparse(this.toTileAST(this.runtimeFilters));
  };

  Query.prototype.targetList = function targetList() {
    return [(0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_status'), 'status'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_version'), 'version'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_record_id'), 'id'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('to_char', [(0, _helpers.ColumnRef)('_server_created_at'), (0, _helpers.AConst)((0, _helpers.StringValue)('YYYY-MM-DD"T"HH24:MI:SS"Z"'))]), 'created_at'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('to_char', [(0, _helpers.ColumnRef)('_server_updated_at'), (0, _helpers.AConst)((0, _helpers.StringValue)('YYYY-MM-DD"T"HH24:MI:SS"Z"'))]), 'updated_at'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('to_char', [(0, _helpers.ColumnRef)('_created_at'), (0, _helpers.AConst)((0, _helpers.StringValue)('YYYY-MM-DD"T"HH24:MI:SS"Z"'))]), 'client_created_at'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('to_char', [(0, _helpers.ColumnRef)('_updated_at'), (0, _helpers.AConst)((0, _helpers.StringValue)('YYYY-MM-DD"T"HH24:MI:SS"Z"'))]), 'client_updated_at'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_created_by_id'), 'created_by_id'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('name', 'created_by'), 'created_by'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_updated_by_id'), 'updated_by_id'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('name', 'updated_by'), 'updated_by'), (0, _helpers.ResTarget)((0, _helpers.TypeCast)((0, _helpers.TypeName)('text'), (0, _helpers.AConst)((0, _helpers.StringValue)(this.form.id))), 'form_id'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_project_id'), 'project_id'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_assigned_to_id'), 'assigned_to_id'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('name', 'assigned_to'), 'assigned_to'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_form_values'), 'form_values'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_latitude'), 'latitude'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_longitude'), 'longitude'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_altitude'), 'altitude'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_speed'), 'speed'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_course'), 'course'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_horizontal_accuracy'), 'horizontal_accuracy'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_vertical_accuracy'), 'vertical_accuracy'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_edited_duration'), 'edited_duration'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_updated_duration'), 'updated_duration'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_created_duration'), 'created_duration')];
  };

  Query.prototype.fromClause = function fromClause(_ref3) {
    var applySort = _ref3.applySort,
        pageSize = _ref3.pageSize,
        pageIndex = _ref3.pageIndex,
        boundingBox = _ref3.boundingBox,
        searchFilter = _ref3.searchFilter;

    var ast = applySort ? this.toRawAST({ sort: this.sortClause, pageSize: pageSize, pageIndex: pageIndex, boundingBox: boundingBox, searchFilter: searchFilter }) : this.toRawAST({ boundingBox: boundingBox, searchFilter: searchFilter });

    var actualQuery = (0, _helpers.RangeSubselect)(ast, (0, _helpers.Alias)('records'));

    var createdByJoin = (0, _helpers.JoinExpr)(1, actualQuery, (0, _helpers.RangeVar)('memberships', (0, _helpers.Alias)('created_by')), (0, _helpers.AExpr)(0, '=', (0, _helpers.ColumnRef)('_created_by_id', 'records'), (0, _helpers.ColumnRef)('user_id', 'created_by')));

    var updatedByJoin = (0, _helpers.JoinExpr)(1, createdByJoin, (0, _helpers.RangeVar)('memberships', (0, _helpers.Alias)('updated_by')), (0, _helpers.AExpr)(0, '=', (0, _helpers.ColumnRef)('_updated_by_id', 'records'), (0, _helpers.ColumnRef)('user_id', 'updated_by')));

    var assignedToJoin = (0, _helpers.JoinExpr)(1, updatedByJoin, (0, _helpers.RangeVar)('memberships', (0, _helpers.Alias)('assigned_to')), (0, _helpers.AExpr)(0, '=', (0, _helpers.ColumnRef)('_assigned_to_id', 'records'), (0, _helpers.ColumnRef)('user_id', 'assigned_to')));

    return [assignedToJoin];
  };

  _createClass(Query, [{
    key: 'form',
    get: function get() {
      return this._form;
    }
  }, {
    key: 'outputs',
    get: function get() {
      return this._outputs;
    }
  }, {
    key: 'filter',
    get: function get() {
      return this._filter;
    }
  }, {
    key: 'sorting',
    get: function get() {
      return this._sorting;
    }
  }, {
    key: 'columnFilters',
    get: function get() {
      return this._columnFilters;
    }
  }, {
    key: 'boundingBox',
    set: function set(box) {
      this._boundingBox = box;
    },
    get: function get() {
      return this._boundingBox;
    }
  }, {
    key: 'searchFilter',
    get: function get() {
      return this._searchFilter || '';
    },
    set: function set(filter) {
      this._searchFilter = filter;
    }
  }, {
    key: 'runtimeFilters',
    get: function get() {
      return {
        boundingBox: this.boundingBox,
        searchFilter: this.searchFilter
      };
    }
  }, {
    key: 'sortClause',
    get: function get() {
      if (this.sorting.isEmpty) {
        return this.systemSortClause;
      }

      // always add the record ID to the sorting so it's stable across executions
      var sorts = this.sorting.expressions.map(function (sort) {
        var direction = sort.direction === 'desc' ? 2 : 1;

        return [(0, _helpers.SortBy)((0, _helpers.ColumnRef)(sort.columnName), direction, 0), (0, _helpers.SortBy)((0, _helpers.ColumnRef)('_record_id'), direction, 0)];
      });

      return _lodash2.default.flatten(sorts);
    }
  }, {
    key: 'systemSortClause',
    get: function get() {
      return [(0, _helpers.SortBy)((0, _helpers.ColumnRef)('_server_updated_at'), 2, 0)];
    }
  }, {
    key: 'outerSortClause',
    get: function get() {
      return [(0, _helpers.SortBy)((0, _helpers.ColumnRef)('_row_number'), 1, 0)];
    }
  }]);

  return Query;
}();

exports.default = Query;
//# sourceMappingURL=query.js.map