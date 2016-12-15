'use strict';

exports.__esModule = true;

var _helpers = require('./helpers');

var _condition = require('../condition');

var _operator = require('../operator');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// import { SelectStmt } from './ast/helpers';

var Converter = function () {
  function Converter() {
    var _this = this;

    _classCallCheck(this, Converter);

    this.BooleanConverter = function (type, condition) {
      var args = _this.nodeForExpressions(condition.expressions);

      if (args && args.length) {
        return (0, _helpers.BoolExpr)(type, args);
      }

      return null;
    };

    this.AndConverter = function (condition) {
      return _this.BooleanConverter(0, condition);
    };

    this.OrConverter = function (condition) {
      return _this.BooleanConverter(1, condition);
    };

    this.NotConverter = function (condition) {
      if (condition.expressions.length > 1) {
        return (0, _helpers.BoolExpr)(2, [_this.BooleanConverter(0, condition)]);
      }

      return _this.BooleanConverter(2, condition);
    };

    this.NotEmptyConverter = function (expression) {
      return (0, _helpers.NullTest)(1, (0, _helpers.ColumnRef)(expression.columnName));
    };

    this.EmptyConverter = function (expression) {
      return (0, _helpers.NullTest)(0, (0, _helpers.ColumnRef)(expression.columnName));
    };

    this.EqualConverter = function (expression) {
      return _this.BinaryConverter(0, '=', expression);
    };

    this.NotEqualConverter = function (expression) {
      return _this.BinaryConverter(0, '<>', expression);
    };

    this.GreaterThanConverter = function (expression) {
      return _this.BinaryConverter(0, '>', expression);
    };

    this.GreaterThanOrEqualConverter = function (expression) {
      return _this.BinaryConverter(0, '>=', expression);
    };

    this.LessThanConverter = function (expression) {
      return _this.BinaryConverter(0, '<', expression);
    };

    this.LessThanOrEqualConverter = function (expression) {
      return _this.BinaryConverter(0, '<=', expression);
    };

    this.InConverter = function (expression) {
      var values = expression.value.map(function (v) {
        return (0, _helpers.AConst)((0, _helpers.StringValue)(v));
      });

      return (0, _helpers.AExpr)(6, '=', (0, _helpers.ColumnRef)(expression.columnName), values);
    };

    this.NotInConverter = function (expression) {
      var values = expression.value.map(function (v) {
        return (0, _helpers.AConst)((0, _helpers.StringValue)(v));
      });

      return (0, _helpers.AExpr)(6, '<>', (0, _helpers.ColumnRef)(expression.columnName), values);
    };

    this.BinaryConverter = function (kind, operator, expression) {
      return (0, _helpers.AExpr)(0, operator, (0, _helpers.ColumnRef)(expression.columnName), (0, _helpers.AConst)((0, _helpers.StringValue)(expression.scalarValue)));
    };

    this.FieldConverter = function (expression) {
      return (0, _helpers.ColumnRef)(expression.name);
    };

    this.ConstantConverter = function (expression) {
      return (0, _helpers.AConst)((0, _helpers.StringValue)(expression.scalarValue));
    };

    this.TextEqualConverter = function (expression) {
      return (0, _helpers.AExpr)(8, '~~*', (0, _helpers.ColumnRef)(expression.columnName), (0, _helpers.AConst)((0, _helpers.StringValue)(expression.scalarValue)));
    };

    this.TextNotEqualConverter = function (expression) {
      return (0, _helpers.AExpr)(8, '!~~*', (0, _helpers.ColumnRef)(expression.columnName), (0, _helpers.AConst)((0, _helpers.StringValue)(expression.scalarValue)));
    };

    this.TextContainConverter = function (expression) {
      return (0, _helpers.AExpr)(8, '~~*', (0, _helpers.ColumnRef)(expression.columnName), (0, _helpers.AConst)((0, _helpers.StringValue)('%' + _this.escapeLikePercent(expression.scalarValue) + '%')));
    };

    this.TextNotContainConverter = function (expression) {
      return (0, _helpers.AExpr)(8, '!~~*', (0, _helpers.ColumnRef)(expression.columnName), (0, _helpers.AConst)((0, _helpers.StringValue)('%' + _this.escapeLikePercent(expression.scalarValue) + '%')));
    };

    this.TextStartsWithConverter = function (expression) {
      return (0, _helpers.AExpr)(8, '~~*', (0, _helpers.ColumnRef)(expression.columnName), (0, _helpers.AConst)((0, _helpers.StringValue)(_this.escapeLikePercent(expression.scalarValue) + '%')));
    };

    this.TextEndsWithConverter = function (expression) {
      return (0, _helpers.AExpr)(8, '~~*', (0, _helpers.ColumnRef)(expression.columnName), (0, _helpers.AConst)((0, _helpers.StringValue)('%' + _this.escapeLikePercent(expression.scalarValue))));
    };

    this.TextMatchConverter = function (expression) {
      return (0, _helpers.AExpr)(0, '~*', (0, _helpers.ColumnRef)(expression.columnName), (0, _helpers.AConst)((0, _helpers.StringValue)(expression.scalarValue)));
    };

    this.TextNotMatchConverter = function (expression) {
      return (0, _helpers.AExpr)(0, '!~*', (0, _helpers.ColumnRef)(expression.columnName), (0, _helpers.AConst)((0, _helpers.StringValue)(expression.scalarValue)));
    };

    this.ArrayAnyOfConverter = function (expression) {
      var values = (0, _helpers.AArrayExpr)(expression.value.map(function (v) {
        return (0, _helpers.AConst)((0, _helpers.StringValue)(v));
      }));

      return (0, _helpers.AExpr)(0, '&&', (0, _helpers.ColumnRef)(expression.columnName), values);
    };

    this.ArrayAllOfConverter = function (expression) {
      var values = (0, _helpers.AArrayExpr)(expression.value.map(function (v) {
        return (0, _helpers.AConst)((0, _helpers.StringValue)(v));
      }));

      return (0, _helpers.AExpr)(0, '@>', (0, _helpers.ColumnRef)(expression.columnName), values);
    };

    this.ArrayEqualConverter = function (expression) {
      var values = (0, _helpers.AArrayExpr)(expression.value.map(function (v) {
        return (0, _helpers.AConst)((0, _helpers.StringValue)(v));
      }));

      var a = (0, _helpers.AExpr)(0, '<@', (0, _helpers.ColumnRef)(expression.columnName), values);

      var b = (0, _helpers.AExpr)(0, '@>', (0, _helpers.ColumnRef)(expression.columnName), values);

      return (0, _helpers.BoolExpr)(0, [a, b]);
    };

    this.SearchConverter = function (expression) {
      var rhs = (0, _helpers.FuncCall)('to_tsquery', [(0, _helpers.AConst)((0, _helpers.StringValue)(expression.scalarValue))]);

      return (0, _helpers.AExpr)(0, '@@', (0, _helpers.ColumnRef)(expression.columnName), rhs);
    };
  }

  Converter.prototype.toAST = function toAST(query, _ref) {
    var sort = _ref.sort,
        pageSize = _ref.pageSize,
        pageIndex = _ref.pageIndex,
        boundingBox = _ref.boundingBox,
        searchFilter = _ref.searchFilter;

    var targetList = this.targetList(query, sort);

    var fromClause = this.fromClause(query);

    var whereClause = this.whereClause(query, boundingBox, searchFilter);

    var sortClause = sort;

    var limitOffset = this.limitOffset(pageSize, pageIndex);

    var limitCount = this.limitCount(pageSize);

    return (0, _helpers.SelectStmt)({ targetList: targetList, fromClause: fromClause, whereClause: whereClause, sortClause: sortClause, limitOffset: limitOffset, limitCount: limitCount });
  };

  Converter.prototype.toCountAST = function toCountAST(query, _ref2) {
    var boundingBox = _ref2.boundingBox,
        searchFilter = _ref2.searchFilter;

    var targetList = [(0, _helpers.ResTarget)((0, _helpers.FuncCall)('count', [(0, _helpers.AConst)((0, _helpers.IntegerValue)(1))]), 'total_count')];

    var fromClause = this.fromClause(query);

    var whereClause = this.whereClause(query, boundingBox, searchFilter);

    return (0, _helpers.SelectStmt)({ targetList: targetList, fromClause: fromClause, whereClause: whereClause });
  };

  Converter.prototype.toTileAST = function toTileAST(query, _ref3) {
    var searchFilter = _ref3.searchFilter;

    var targetList = [(0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_record_id')), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('st_x', [(0, _helpers.ColumnRef)('_geometry')]), 'x'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('st_y', [(0, _helpers.ColumnRef)('_geometry')]), 'y'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('_status')), (0, _helpers.ResTarget)((0, _helpers.TypeCast)((0, _helpers.TypeName)('text'), (0, _helpers.AConst)((0, _helpers.StringValue)(query.form.id))), 'form_id')];

    var fromClause = this.fromClause(query);

    var whereClause = this.whereClause(query, null, searchFilter);

    return (0, _helpers.SelectStmt)({ targetList: targetList, fromClause: fromClause, whereClause: whereClause });
  };

  Converter.prototype.toHistogramAST = function toHistogramAST(query, _ref4) {
    var columnName = _ref4.columnName,
        bucketSize = _ref4.bucketSize,
        type = _ref4.type,
        sort = _ref4.sort,
        pageSize = _ref4.pageSize,
        pageIndex = _ref4.pageIndex,
        boundingBox = _ref4.boundingBox,
        searchFilter = _ref4.searchFilter;

    var targetList = [(0, _helpers.ResTarget)((0, _helpers.ColumnRef)('series', 'series'), 'bucket'), (0, _helpers.ResTarget)((0, _helpers.CoalesceExpr)([(0, _helpers.ColumnRef)('count', 'sub'), (0, _helpers.AConst)((0, _helpers.IntegerValue)(0))]), 'count'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('min_value', 'sub'), 'min_value'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('max_value', 'sub'), 'max_value'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('avg_value', 'sub'), 'avg_value'), (0, _helpers.ResTarget)((0, _helpers.ColumnRef)('sum_value', 'sub'), 'sum_value')];

    var withClause = this.histogramWithClause(columnName, bucketSize, type, query);

    var seriesFunctionSublinkSelect = (0, _helpers.SelectStmt)({
      targetList: [(0, _helpers.ResTarget)((0, _helpers.AExpr)(0, '+', (0, _helpers.ColumnRef)('buckets'), (0, _helpers.AConst)((0, _helpers.IntegerValue)(1))))],
      fromClause: [(0, _helpers.RangeVar)('__stats')]
    });

    var seriesFunctionArgs = [(0, _helpers.AConst)((0, _helpers.IntegerValue)(1)), (0, _helpers.SubLink)(4, seriesFunctionSublinkSelect)];

    var seriesFunctionCall = (0, _helpers.FuncCall)('generate_series', seriesFunctionArgs);
    var seriesFunction = (0, _helpers.RangeFunction)([[seriesFunctionCall]], (0, _helpers.Alias)('series'));

    var bucketWidthFunctionCallArgs = [(0, _helpers.TypeCast)((0, _helpers.TypeName)([(0, _helpers.StringValue)('pg_catalog'), (0, _helpers.StringValue)('float8')]), (0, _helpers.ColumnRef)('value')), (0, _helpers.SubLink)(4, (0, _helpers.SelectStmt)({ targetList: [(0, _helpers.ResTarget)((0, _helpers.ColumnRef)('min_value'))], fromClause: [(0, _helpers.RangeVar)('__stats')] })), (0, _helpers.SubLink)(4, (0, _helpers.SelectStmt)({ targetList: [(0, _helpers.ResTarget)((0, _helpers.ColumnRef)('max_value'))], fromClause: [(0, _helpers.RangeVar)('__stats')] })), (0, _helpers.SubLink)(4, (0, _helpers.SelectStmt)({ targetList: [(0, _helpers.ResTarget)((0, _helpers.ColumnRef)('buckets'))], fromClause: [(0, _helpers.RangeVar)('__stats')] }))];

    var bucketsSubqueryTargetList = [(0, _helpers.ResTarget)((0, _helpers.FuncCall)('width_bucket', bucketWidthFunctionCallArgs), 'bucket'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('count', [(0, _helpers.AConst)((0, _helpers.IntegerValue)(1))]), 'count'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('min', [(0, _helpers.ColumnRef)('value')]), 'min_value'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('max', [(0, _helpers.ColumnRef)('value')]), 'max_value'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('avg', [(0, _helpers.ColumnRef)('value')]), 'avg_value'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('sum', [(0, _helpers.ColumnRef)('value')]), 'sum_value')];

    var bucketsSubqueryFromClause = [(0, _helpers.RangeVar)('__records')];
    var bucketsSubqueryGroupClause = [(0, _helpers.AConst)((0, _helpers.IntegerValue)(1))];
    var bucketsSubquerySortClause = [(0, _helpers.SortBy)((0, _helpers.AConst)((0, _helpers.IntegerValue)(1)), 0, 0)];

    var bucketsSubquery = (0, _helpers.SelectStmt)({
      targetList: bucketsSubqueryTargetList,
      fromClause: bucketsSubqueryFromClause,
      groupClause: bucketsSubqueryGroupClause,
      sortClause: bucketsSubquerySortClause
    });

    var bucketsSubselect = (0, _helpers.RangeSubselect)(bucketsSubquery, (0, _helpers.Alias)('sub'));

    var joinExpr = (0, _helpers.JoinExpr)(1, seriesFunction, bucketsSubselect, (0, _helpers.AExpr)(0, '=', (0, _helpers.ColumnRef)('series', 'series'), (0, _helpers.ColumnRef)('bucket', 'sub')));

    return (0, _helpers.SelectStmt)({ targetList: targetList, fromClause: [joinExpr], withClause: withClause });
  };

  Converter.prototype.toDistinctValuesAST = function toDistinctValuesAST(query) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var targetList = options.array ? [(0, _helpers.ResTarget)((0, _helpers.FuncCall)('unnest', [(0, _helpers.ColumnRef)(options.name)]), 'value')] : [(0, _helpers.ResTarget)((0, _helpers.ColumnRef)(options.name), 'value')];

    targetList.push((0, _helpers.ResTarget)((0, _helpers.FuncCall)('count', [(0, _helpers.AConst)((0, _helpers.IntegerValue)(1))]), 'count'));

    var fromClause = this.fromClause(query);

    var whereClause = null; // this.whereClause(query);

    var groupClause = [(0, _helpers.AConst)((0, _helpers.IntegerValue)(1))];

    var sortClause = [];

    if (options.by === 'frequency') {
      sortClause.push((0, _helpers.SortBy)((0, _helpers.AConst)((0, _helpers.IntegerValue)(2)), 2, 0));
    }

    sortClause.push((0, _helpers.SortBy)((0, _helpers.AConst)((0, _helpers.IntegerValue)(1)), 1, 0));

    return (0, _helpers.SelectStmt)({ targetList: targetList, fromClause: fromClause, whereClause: whereClause, groupClause: groupClause, sortClause: sortClause });
  };

  Converter.prototype.histogramWithClause = function histogramWithClause(columnName, bucketSize, type, query) {
    var recordsTargetList = null;

    if (type === 'date') {
      var datePartArgs = [(0, _helpers.AConst)((0, _helpers.StringValue)('epoch')), (0, _helpers.TypeCast)((0, _helpers.TypeName)('date'), (0, _helpers.ColumnRef)(columnName))];

      recordsTargetList = [(0, _helpers.ResTarget)((0, _helpers.FuncCall)('date_part', datePartArgs), 'value')];
    } else {
      recordsTargetList = [(0, _helpers.ResTarget)((0, _helpers.TypeCast)((0, _helpers.TypeName)([(0, _helpers.StringValue)('pg_catalog'), (0, _helpers.StringValue)('float8')]), (0, _helpers.ColumnRef)(columnName)), 'value')];
    }

    var recordsFromClause = [(0, _helpers.RangeVar)(query.form.id + '/_full')];
    var recordsSelect = (0, _helpers.SelectStmt)({ targetList: recordsTargetList, fromClause: recordsFromClause });
    var recordsExpr = (0, _helpers.CommonTableExpr)('__records', recordsSelect);

    var statsTargetList = [(0, _helpers.ResTarget)((0, _helpers.AConst)((0, _helpers.IntegerValue)(bucketSize)), 'buckets'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('count', [(0, _helpers.AConst)((0, _helpers.IntegerValue)(1))]), 'count'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('min', [(0, _helpers.ColumnRef)('value')]), 'min_value'), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('max', [(0, _helpers.ColumnRef)('value')]), 'max_value')];

    var statsFromClause = [(0, _helpers.RangeVar)('__records')];
    var statsSelect = (0, _helpers.SelectStmt)({ targetList: statsTargetList, fromClause: statsFromClause });
    var statsExpr = (0, _helpers.CommonTableExpr)('__stats', statsSelect);

    return (0, _helpers.WithClause)([recordsExpr, statsExpr]);
  };

  Converter.prototype.limitOffset = function limitOffset(pageSize, pageIndex) {
    if (pageSize != null && pageIndex != null) {
      return (0, _helpers.AConst)((0, _helpers.IntegerValue)(+pageIndex * +pageSize));
    }

    return null;
  };

  Converter.prototype.limitCount = function limitCount(pageSize) {
    if (pageSize != null) {
      return (0, _helpers.AConst)((0, _helpers.IntegerValue)(+pageSize));
    }

    return null;
  };

  Converter.prototype.targetList = function targetList(query, sort) {
    return [(0, _helpers.ResTarget)((0, _helpers.ColumnRef)((0, _helpers.AStar)())), (0, _helpers.ResTarget)((0, _helpers.FuncCall)('row_number', null, (0, _helpers.WindowDef)(sort, 530)), '_row_number')];
  };

  Converter.prototype.fromClause = function fromClause(query) {
    return [(0, _helpers.RangeVar)(query.form.id + '/_full')];
  };

  Converter.prototype.whereClause = function whereClause(query, boundingBox, search) {
    var systemParts = [];
    var filterNode = this.nodeForCondition(query.filter);

    if (boundingBox) {
      systemParts.push(this.boundingBoxFilter(boundingBox));
    }

    if (search && search.trim().length) {
      systemParts.push(this.searchFilter(search));
    }

    var columnFilterKeys = Object.keys(query.columnFilters);

    if (columnFilterKeys.length) {
      for (var _iterator = columnFilterKeys, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref5;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref5 = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref5 = _i.value;
        }

        var key = _ref5;

        var filter = query.columnFilters[key];

        if (filter.hasValues) {
          (function () {
            var hasNull = false;
            var values = [];

            filter.value.forEach(function (v) {
              if (v !== null) {
                values.push((0, _helpers.AConst)((0, _helpers.StringValue)(v)));
              } else {
                hasNull = true;
              }
            });

            var expr = null;

            if (values.length) {
              expr = (0, _helpers.AExpr)(6, '=', (0, _helpers.ColumnRef)(filter.columnName), values);

              if (hasNull) {
                expr = (0, _helpers.BoolExpr)(1, [(0, _helpers.NullTest)(0, (0, _helpers.ColumnRef)(filter.columnName)), expr]);
              }
            } else if (hasNull) {
              expr = (0, _helpers.NullTest)(0, (0, _helpers.ColumnRef)(filter.columnName));
            }

            systemParts.push(expr);
          })();
        } else if (filter.isEmptySet) {
          // add 1 = 0 clause to return 0 rows
          var _expr = (0, _helpers.AExpr)(0, '=', (0, _helpers.AConst)((0, _helpers.IntegerValue)(1)), (0, _helpers.AConst)((0, _helpers.IntegerValue)(0)));

          systemParts.push(_expr);
        }
      }
    }

    if (filterNode && systemParts.length) {
      return (0, _helpers.BoolExpr)(0, [filterNode].concat(systemParts));
    } else if (systemParts.length) {
      return (0, _helpers.BoolExpr)(0, [].concat(systemParts));
    }

    return filterNode;
  };

  Converter.prototype.boundingBoxFilter = function boundingBoxFilter(boundingBox) {
    var args = [(0, _helpers.AConst)((0, _helpers.FloatValue)(boundingBox[0])), (0, _helpers.AConst)((0, _helpers.FloatValue)(boundingBox[1])), (0, _helpers.AConst)((0, _helpers.FloatValue)(boundingBox[2])), (0, _helpers.AConst)((0, _helpers.FloatValue)(boundingBox[3])), (0, _helpers.AConst)((0, _helpers.IntegerValue)(4326))];

    var rhs = (0, _helpers.FuncCall)('st_makeenvelope', args);

    return (0, _helpers.AExpr)(0, '&&', (0, _helpers.ColumnRef)('_geometry'), rhs);
  };

  Converter.prototype.escapeLikePercent = function escapeLikePercent(value) {
    return value.replace(/\%/g, '\\%');
  };

  Converter.prototype.searchFilter = function searchFilter(search) {
    /*
       Search takes the general form:
        SELECT ...
       FROM ...
       WHERE
         _record_index @@ to_tsquery('english', '''bacon'':*'::tsquery::text) AND
         _record_index_text ILIKE '%bacon%'
        NB: The awkward cast through a text type is to properly escape raw user input as a tsquery.
        For example:
         to_tsquery('Nor:*') vs 'Nor:*'::tsquery
        Also, the ILIKE handles further reduces the resultset to exact matches which is what Fulcrum
       users more often expect. The general idea is to use the FTS index to massively reduce the result
       set before applying the much slower ILIKE operation. So, we can reduce the result very quickly
       with the tsvector index first, and then only run the ILIKE on what's left.
    */

    search = search.trim();

    var toTsQuery = function toTsQuery(dictionary, term) {
      var args = [(0, _helpers.AConst)((0, _helpers.StringValue)(dictionary)), (0, _helpers.AConst)((0, _helpers.StringValue)("'" + term + "':*"))];

      return (0, _helpers.FuncCall)('to_tsquery', args);
    };

    var makeTsQueryCall = function makeTsQueryCall(term) {
      return toTsQuery(term.length > 3 ? 'english' : 'simple', term.toLowerCase().replace(/'/g, "''"));
    };

    var terms = search.split(' ').filter(function (s) {
      return s.trim().length;
    });

    var term = terms.shift();

    var tsQueries = makeTsQueryCall(term);

    while (terms.length) {
      term = terms.shift();
      tsQueries = (0, _helpers.AExpr)(0, '&&', tsQueries, makeTsQueryCall(term));
    }

    var ftsExpression = (0, _helpers.AExpr)(0, '@@', (0, _helpers.ColumnRef)('_record_index'), tsQueries);

    var ilikeExpression = (0, _helpers.AExpr)(8, '~~*', (0, _helpers.ColumnRef)('_record_index_text'), (0, _helpers.AConst)((0, _helpers.StringValue)('%' + this.escapeLikePercent(search) + '%')));

    var andArgs = [ftsExpression, ilikeExpression];

    return (0, _helpers.BoolExpr)(0, andArgs);
  };

  Converter.prototype.nodeForExpressions = function nodeForExpressions(expressions) {
    var _this2 = this;

    return expressions.map(function (e) {
      return _this2.nodeForExpression(e);
    }).filter(function (e) {
      return e;
    });
  };

  Converter.prototype.nodeForCondition = function nodeForCondition(condition) {
    var _converter;

    var converter = (_converter = {}, _converter[_condition.ConditionType.And] = this.AndConverter, _converter[_condition.ConditionType.Or] = this.OrConverter, _converter[_condition.ConditionType.Not] = this.NotConverter, _converter);

    return converter[condition.type](condition);
  };

  Converter.prototype.nodeForExpression = function nodeForExpression(expression) {
    var _converter2;

    if (expression.expressions) {
      return this.nodeForCondition(expression);
    }

    var converter = (_converter2 = {}, _converter2[_operator.OperatorType.Empty.name] = this.EmptyConverter, _converter2[_operator.OperatorType.NotEmpty.name] = this.NotEmptyConverter, _converter2[_operator.OperatorType.Equal.name] = this.EqualConverter, _converter2[_operator.OperatorType.NotEqual.name] = this.NotEqualConverter, _converter2[_operator.OperatorType.GreaterThan.name] = this.GreaterThanConverter, _converter2[_operator.OperatorType.GreaterThanOrEqual.name] = this.GreaterThanOrEqualConverter, _converter2[_operator.OperatorType.LessThan.name] = this.LessThanConverter, _converter2[_operator.OperatorType.LessThanOrEqual.name] = this.LessThanOrEqualConverter, _converter2[_operator.OperatorType.Between.name] = this.BetweenConverter, _converter2[_operator.OperatorType.NotBetween.name] = this.NotBetweenConverter, _converter2[_operator.OperatorType.In.name] = this.InConverter, _converter2[_operator.OperatorType.NotIn.name] = this.NotInConverter, _converter2[_operator.OperatorType.TextContain.name] = this.TextContainConverter, _converter2[_operator.OperatorType.TextNotContain.name] = this.TextNotContainConverter, _converter2[_operator.OperatorType.TextStartsWith.name] = this.TextStartsWithConverter, _converter2[_operator.OperatorType.TextEndsWith.name] = this.TextEndsWithConverter, _converter2[_operator.OperatorType.TextEqual.name] = this.TextEqualConverter, _converter2[_operator.OperatorType.TextNotEqual.name] = this.TextNotEqualConverter, _converter2[_operator.OperatorType.TextMatch.name] = this.TextMatchConverter, _converter2[_operator.OperatorType.TextNotMatch.name] = this.TextNotMatchConverter, _converter2[_operator.OperatorType.DateEqual.name] = this.DateEqualConverter, _converter2[_operator.OperatorType.DateAfter.name] = this.DateAfterConverter, _converter2[_operator.OperatorType.DateBefore.name] = this.DateBeforeConverter, _converter2[_operator.OperatorType.ArrayAnyOf.name] = this.ArrayAnyOfConverter, _converter2[_operator.OperatorType.ArrayAllOf.name] = this.ArrayAllOfConverter, _converter2[_operator.OperatorType.ArrayEqual.name] = this.ArrayEqualConverter, _converter2[_operator.OperatorType.Search.name] = this.SearchConverter, _converter2);

    if (!expression.isValid) {
      return null;
    }

    return converter[expression.operator](expression);
  };

  return Converter;
}();

exports.default = Converter;
//# sourceMappingURL=converter.js.map